/**
 * bitcoinprices.js
 *
 * Display human-friendly bitcoin prices, both desktop and mobile.
 *
 * Copyright 2013 Mikko Ohtamaa http://opensourcehacker.com
 *
 * Licensed under MIT license.
 */

(function($) {

    "use strict";

    var bitcoinprices = {

        /** Store exchange rate data as returned by bitcoinaverages.com */
        data : null,

        /** Our configuration options */
        config : null,

        /**
         * Update market rate data from the server using JSON AJAX request.
         *
         * Assumes the server sets proper cache headers, so we are not bombing
         * the server.
         */
        loadData : function () {

            var self = this;

            $.getJSON(self.config.url, function(resp) {
                self.data = resp;
                $(document).trigger("marketdataavailable");
            }).error(function() {
                throw new Error("Could not load exchage rate data from:" + self.config.url);
            });
        },

        /**
         * Convert between BTC and fiat currecy.
         *
         * @param  {Number} amount Currency amount to convert
         * @param  {String} source Three-letter currency code
         * @param  {String} target Three-letter currency code
         * @return {Number}        Amount in other currency
         */
        convert : function(amount, source, target)  {

            var inverse;

            if(!$.isNumeric(amount)) {
                throw new Error("Amount must be numeric");
            }

            if(!source || !target) {
                throw new Error("You need to give both source and target currency:" + source + " " + target);
            }

            // No conversion
            if(source == "BTC" && target == "BTC") {
                return amount;
            }

            if(!(source == "BTC" || target == "BTC")) {
                // Convert through BTC
                return this.convert(this.convert(amount, source, "BTC"), "BTC", target);
            }

            if(source == "BTC") {
                inverse = true;
                // http://stackoverflow.com/a/16201730/315168
                target = [source, source = target][0];
            } else {
                inverse = false;
            }

            if(!this.data) {
                throw new Error("Exchange rate data not available");
            }

            var currencyData = this.data[source];
            if(!currencyData) {
                throw new Error("We do not have market data for currency: " + source);
            }

            var rate = currencyData[this.config.marketRateVariable];

            if(!rate) {
                throw new Error("Cannot parse bitcoinaverage data for " + source + " " + this.config.url);
            }

            if(inverse) {
                return amount*rate;
            } else {
                return amount/rate;
            }
        },

        /**
         * Format a price for a currency.
         *
         * Fills in currency symbols we have configured.
         *
         * @param  {Number} amount
         * @param  {String} currency Three letter currency code
         * @param  {Boolean} symbol Add currency symbol
         * @return {String} HTML snippet
         */
        formatPrice : function (amount, currency, symbol) {

            var decimals;

            if(currency == "BTC") {
                decimals = 8;
            } else {
                decimals = 2;
            }

            var formatted = amount.toFixed(decimals);

            if(symbol) {
                formatted += " " + this.getCurrencySymbol(currency);
            }

            return formatted;
        },

        /**
         * Get HTML for a currency symbol
         * @param  {String} currency Three-letter currency code
         */
        getCurrencySymbol : function(currency) {
            var symbols = this.config.symbols || {};
            var symbol = this.config.symbols[currency] || currency;
            return symbol;
        },

        /**
         * Assume we have market data available.
         *
         * Update the prices to reflect the current state of selected
         * currency and market price.
         */
        updatePrices : function() {

            var self = this;
            var currentCurrency = this.getActiveCurrency();

            // Find all elements which declare themselves to present BTC prices
            $("[data-btc-price]").each(function() {
                var elem = $(this);
                var btcPrice = elem.attr("data-btc-price");
                try {
                    btcPrice = parseFloat(btcPrice, 10);
                } catch(e) {
                    // On invalid price keep going forward
                    // silently ignoring this
                    return;
                }

                var priceSymbol = elem.attr("data-price-symbol") != "off";
                var inCurrentCurrency = self.convert(btcPrice, "BTC", currentCurrency);

                elem.html(self.formatPrice(inCurrentCurrency, currentCurrency, priceSymbol));

            });
        },

        /**
         * Update currency symbols on the page which are not directly associated with a price.
         */
        updateCurrencySymbols : function() {
            $(".current-currency-symbol").html(this.getCurrencySymbol(this.getActiveCurrency()));
        },

        /**
         * Get the currency selected by the user.
         */
        getActiveCurrency : function() {
            return window.localStorage["bitcoinprices.currency"] || this.config.defaultCurrency || "BTC";
        },

        /**
         * If we have an active currency which is not provided by current data return to BTC;
         */
        resetCurrency : function() {
            var currency = this.getActiveCurrency();
            var idx = $.inArray(currency, this.config.currencies);
            if(idx < 0) {
                window.localStorage["bitcoinprices.currency"] = "BTC";
            }
        },

        /**
         * Loop available currencies, select next one.
         *
         * @return {String} user-selected next three-letter currency code
         */
        toggleNextActiveCurrency : function() {

            var currency = this.getActiveCurrency();
            var idx = $.inArray(currency, this.config.currencies);
            if(idx < 0) {
                idx = 0;
            }
            idx = (++idx) % this.config.currencies.length;

            currency = window.localStorage["bitcoinprices.currency"] = this.config.currencies[idx];

            return currency;
        },

        /**
         * User changes the default currency through clicking a price.
         */
        installClicker : function() {
            var self = this;
            function onclick(e) {
                e.preventDefault();
                self.toggleNextActiveCurrency();
                $(document).trigger("activecurrencychange");
            }

            // We have now market data available,
            // decoreate elements so the user knows there is interaction
            $("[data-btc-price]").addClass("clickable-price");
            $(".current-currency-symbol").addClass("clickable-price");
            $(".clickable-price").click(onclick);
        },

        /**
         * Populate Bootstrap dropdown menu "currency-dropdown" with available currency choices.
         *
         * Automatically toggle the currently activated currency.
         */
        installCurrencyMenu : function() {
            var self = this;
            var menu = $(".currency-dropdown");

            function updateCurrencyInMenu(currency) {
                var symbol = self.getCurrencySymbol(currency);
                menu.find(".currency-symbol").html(symbol);
                menu.find("li[data-currency]").removeClass("active");
                menu.find("li[data-currency=" + currency + "]").addClass("active");
            }

            function buildMenu() {

                $.each(self.config.currencies, function() {
                    var symbol = self.getCurrencySymbol(this);
                    var template = [
                        "<li class='currency-menu-entry' data-currency='",
                        this,
                        "'><a role='menuitem'>",
                        symbol,
                        "</a></li>"
                    ];

                    var html = template.join("");
                    menu.find("ul").append(html);
                });
            }


            buildMenu();

            $(document).on("activecurrencychange", function() {
                var active = self.getActiveCurrency();
                updateCurrencyInMenu(active);
            });

            menu.on("click", ".currency-menu-entry", function(e) {
                var currency = $(this).attr("data-currency");
                window.localStorage["bitcoinprices.currency"] = currency;
                $(document).trigger("activecurrencychange");
            });

            // Initialize the currency from what the user had on the last page load
            var active = this.getActiveCurrency();
            updateCurrencyInMenu(active);
        },

        /**
         * Make prices clickable and tooltippable.
         *
         * Assume we have market data available.
         */
        installUX : function() {
            var self = this;

            if(self.config.ux.clickPrices) {
                this.installClicker();
            }

            if(self.config.ux.menu) {
                this.installCurrencyMenu();
            }

            // Whenever some UX element updates the active currency then refresh the page
            $(document).bind("activecurrencychange", function() {
                self.updatePrices();
                self.updateCurrencySymbols();
            });

        },


        /**
         * Call to initialize the detault bitcoinprices UI.
         */
        init : function(_config) {

            var self = this;
            this.config = _config;

            $(document).bind("marketdataavailable", function() {
                self.updatePrices();
                self.updateCurrencySymbols();
                self.installUX();
            });

            this.loadData();
        }
    };

    // export
    window.bitcoinprices = bitcoinprices;

})(jQuery);