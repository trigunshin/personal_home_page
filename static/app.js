var gridster;
var scout_cal_html = '<iframe src="https://www.google.com/calendar/embed?title=scout%20calendar&amp;showTitle=0&amp;showPrint=0&amp;showTabs=0&amp;mode=WEEK&amp;height=250&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;src=pcrane%40goscoutgo.com&amp;color=%23B1440E&amp;src=talentdrive.com_f6tpmp29u1k06fm90jio0p0r40%40group.calendar.google.com&amp;color=%23333333&amp;ctz=America%2FNew_York" style=" border-width:0 " width="600" height="250" frameborder="0" scrolling="no"></iframe>';
var header_html = "<header>|||</header>";
var bitcoin_html = '<div>USD/BTC price: <span data-btc-price="1.0">1.0 BTC</span></div>';


//function gmail_auth() {
    var clientId = '155830396465-td1o0sadjfr0mcg5ppl4jfb6tovqbl4d.apps.googleusercontent.com';

    var apiKey = 'AIzaSyBejn8hBTZsVJBYVcBNZUjqV8vvCDaOFVU';
    //var scopes = "// https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify  https://www.googleapis.com/auth/gmail.readonly";
    var scopes = 'https://www.googleapis.com/auth/plus.me';

    function handleClientLoad() {
        // Step 2: Reference the API key
        gapi.client.setApiKey(apiKey);
        window.setTimeout(checkAuth,1);
    }

    function checkAuth() {
        gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
    }

    function handleAuthResult(authResult) {
        console.log('auth result', authResult);
        var authorizeButton = document.getElementById('authorize-button');
        if (authResult && !authResult.error) {
            authorizeButton.style.visibility = 'hidden';
            makeApiCall();
        } else {
            authorizeButton.style.visibility = '';
            authorizeButton.onclick = handleAuthClick;
        }
    }

    function handleAuthClick(event) {
        // Step 3: get authorization to use private data
        gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
        return false;
    }

    // Load the API and make an API call.  Display the results on the screen.
    function makeApiCall() {
        // Step 4: Load the Google+ API
        gapi.client.load('plus', 'v1').then(function() {
            // Step 5: Assemble the API request
            var request = gapi.client.plus.people.get({
                'userId': 'me'
            });
        // Step 6: Execute the API request
        request.then(function(resp) {
            var heading = document.createElement('h4');
            var image = document.createElement('img');
            image.src = resp.result.image.url;
            heading.appendChild(image);
            heading.appendChild(document.createTextNode(resp.result.displayName));

            document.getElementById('content').appendChild(heading);
        }, function(reason) {
                  console.log('Error: ' + reason.result.error.message);
            });
        });
    }

//}


function bitcoin_price() {
    bitcoinprices.init({
        // Where we get bitcoinaverage data
        url: "https://api.bitcoinaverage.com/ticker/all",

        // Which of bitcoinaverages value we use to present prices
        marketRateVariable: "24h_avg",
        // Which currencies are in shown to the user
        //currencies: ["BTC", "USD", "EUR", "CNY"],
        currencies: ["USD"],
        // Special currency symbol artwork
        symbols: {
            "BTC": "<i class='fa fa-btc'></i>"
        },
        // Which currency we show user by the default if
        // no currency is selected
        defaultCurrency: "USD",
        // How the user is able to interact with the prices
        ux : {
            // Make everything with data-btc-price HTML attribute clickable
            clickPrices : true,
            // Build Bootstrap dropdown menu for currency switching
            menu : false,
            // Allow user to cycle through currency choices in currency:
            clickableCurrencySymbol:  false
        },

        // Allows passing the explicit jQuery version to bitcoinprices.
        // This is useful if you are using modular javascript (AMD/UMD/require()),
        // but for most normal usage you don't need this
        jQuery: jQuery,
        // Price source data attribute
        priceAttribute: "data-btc-price",
        // Price source currency for data-btc-price attribute.
        // E.g. if your shop prices are in USD
        // but converted to BTC when you do Bitcoin
        // checkout, put USD here.
        priceOrignalCurrency: "BTC"
    });
};

$(function(){
    gridster = $(".gridster > ul").gridster({
        widget_margins: [2, 2],
        widget_base_dimensions: [600, 260],
        max_cols: 3,
        max_cols: 3,
        extra_rows: 1,
        draggable: {
            handle: 'header'
        }
    }).data('gridster');

    var widgets = [
        ["<li>"+header_html+'<div id="stock_data_anchor"></div>'+"</li>", 1, 1],
        ["<li>"+header_html+scout_cal_html+"</li>", 1, 1],
        ["<li>"+header_html+bitcoin_html+"</li>", 1, 1]
    ];
    $.each(widgets, function(i, widget){
        gridster.add_widget.apply(gridster, widget)
    });

    var price_template = $('script#stock_template').html();
    var symbols = ['IBM',"BAC","AIZ","UHAL","AEG"];

    function get_data(symbol_csv) {
        var url = 'https://query.yahooapis.com/v1/public/yql';
        var data = encodeURIComponent("select * from yahoo.finance.quotes where symbol in ('" + symbol_csv + "')");
        $.getJSON(url, 'q=' + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env").done(function (data) {
            var compiled_template = _.template(price_template);
            var template_data = compiled_template({results: data.query.results.quote});
            $("div#stock_data_anchor").append(template_data);
        }).fail(function (jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.log('Request failed: ' + err);
        });
    };
    get_data(symbols);
    bitcoin_price();
});
// GET https://www.googleapis.com/gmail/v1/users/trigunshin%40gmail.com/messages?includeSpamTrash=false&maxResults=20&q=label%3Aunread+label%3Ainbox&key={YOUR_API_KEY}