var gridster;
var scout_cal_html = '<iframe src="https://www.google.com/calendar/embed?showTitle=0&amp;showPrint=0&amp;showTz=0&amp;mode=WEEK&amp;height=220&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;src=pcrane%40goscoutgo.com&amp;color=%23B1440E&amp;ctz=America%2FNew_York" style=" border-width:0 " width="450" height="220" frameborder="0" scrolling="no"></iframe>';
var stock_widget_html = '<div id="stock_data_anchor"></div>';
var gmail_widget_html = '<div id="gmail_content"><button id="authorize-button" style="visibility: hidden">Authorize</button><div id="gmail_data_anchor_<%= data.widget_num %>"></div></div>';
var qlink_data = {qlinks: [
    {name: 'cs colorgame', url: 'http://cs-interview-questions.herokuapp.com/static/color_game.html'}
    //, {name: '', url: ''}
]};

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
function generate_stock_widget(symbol_csv) {
    var price_template = $('script#stock_template').html();
    var url = 'https://query.yahooapis.com/v1/public/yql';
    var data = encodeURIComponent("select * from yahoo.finance.quotes where symbol in ('" + symbol_csv + "')");
    $.getJSON(url, 'q=' + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env").done(function (data) {
        var compiled_template = _.template(price_template);
        var sorted_results = _.sortBy(data.query.results.quote, function(result) {
            //return -1 * parseFloat(result.PercentChange);
            return result.PercentChange.substring(1);
        });
        var template_data = compiled_template({results: sorted_results.reverse()});
        $("div#stock_data_anchor").append(template_data);

        bitcoin_price();
    }).fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log('Request failed: ' + err);
    });
}
function wrap_with_header(title, html) {
    return "<header>"+title+"</header>"+html;
}
function wrap_with_li(html) {
    return "<li>" + html + "</li>";
}

function fill_email_widget(email, num) {
    $.get("/api/imap/"+email, function(email_data) {
        var gmail_template = $('script#gmail_template').html();
        var compiled_template = _.template(gmail_template);
        var data = {
            count: email_data.emails.length,
            widget_num: num,
            emails: email_data.emails
        };

        var template_data = compiled_template({data: data});
        $("div#gmail_data_anchor_"+num).append(template_data);
    });
}
function init_email_widget(email, num) {
    // compile widget template
    var widget_data = {
        user_id: email,
        widget_num: num
    }
    var compiled_template = _.template(gmail_widget_html);
    var finished_template = compiled_template({data: widget_data});

    return [wrap_with_li(wrap_with_header(widget_data.user_id, finished_template)), 2, 1];
}
function create_email_widgets(cb) {
    $.get("/api/imap/list", function(data) {
        var widget_templates = _.map(data.emails, init_email_widget);
        return cb(null, widget_templates, data.emails);
    });
}

function create_quicklink_widget(qlinks) {
    var qlink_template = $('script#qlink_template').html();
    var compiled_template = _.template(qlink_template);
    var finished_template = compiled_template({data: qlinks});

    return [wrap_with_li(wrap_with_header('quicklinks', finished_template)), 1, 1];
}

$(function first_render(){
    gridster = $(".gridster > ul").gridster({
        widget_margins: [2, 2],
        widget_base_dimensions: [450, 250],
        //max_cols: 10,
        extra_rows: 1,
        draggable: {
            handle: 'header'
        }
    }).data('gridster');

    create_email_widgets(function(err, email_widgets, emails) {
        if (err) {
            $('body').append(JSON.stringify(err));
            return console.log(err);
        }
        // init widgets
        var widgets = email_widgets;

        widgets.push([wrap_with_li(wrap_with_header("Ticker Data", stock_widget_html)), 1, 2]);
        widgets.push([wrap_with_li(wrap_with_header("Scout Calendar", scout_cal_html)), 1, 1]);

        widgets.push(create_quicklink_widget(qlink_data));

        // add widgets to page
        $.each(widgets, function(i, widget){
            gridster.add_widget.apply(gridster, widget)
        });

        // fill widgets with dat
        var symbols = ['IBM',"BAC","AIZ","UHAL","AEG","LL","LUKOY","XOM","KRFT"];
        generate_stock_widget(symbols);
        _.each(emails, fill_email_widget);
    });
});
