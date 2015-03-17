var gridster;
var scout_cal_html = '<iframe src="https://www.google.com/calendar/embed?title=scout%20calendar&amp;showTitle=0&amp;showPrint=0&amp;showTabs=0&amp;mode=WEEK&amp;height=250&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;src=pcrane%40goscoutgo.com&amp;color=%23B1440E&amp;src=talentdrive.com_f6tpmp29u1k06fm90jio0p0r40%40group.calendar.google.com&amp;color=%23333333&amp;ctz=America%2FNew_York" style=" border-width:0 " width="450" height="220" frameborder="0" scrolling="no"></iframe>';
var stock_widget_html = '<div id="stock_data_anchor"></div>';
var gmail_widget_html = '<div id="gmail_content"><button id="authorize-button" style="visibility: hidden">Authorize</button><div id="gmail_data_anchor_<%= data.widget_num %>"></div></div>';

var clientId = '155830396465-td1o0sadjfr0mcg5ppl4jfb6tovqbl4d.apps.googleusercontent.com';
var scopes = "https://mail.google.com/ https://www.googleapis.com/auth/gmail.modify  https://www.googleapis.com/auth/gmail.readonly";
var gmail_widgets = [
    {
        user_id: "trigunshin@gmail.com",
        widget_num: 1
    },{
        user_id: "patrickryancrane@gmail.com",
        widget_num: 2
    }
];

//////////// gmail scripting
function handleClientLoad() {
    window.setTimeout(checkAuth,1);
}

function checkAuth() {
    gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeButton = document.getElementById('authorize-button');
    if (authResult && !authResult.error) {
        authorizeButton.style.visibility = 'hidden';

        _.each(gmail_widgets, function(gmail_widget) {
            fetch_unread_email_data(gmail_widget, post_gmail_auth);
        });
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

function post_gmail_auth(widget_data, result, err) {
    if(err) return console.log('Error: ' + err.message);

    var widget_num = widget_data.widget_num;
    var user_id = widget_data.user_id;

    var result_size = 0;
    if(result) result_size = result.resultSizeEstimate;
    var result_messages = [];
    if(result) result_messages = result.messages;

    var gmail_template = $('script#gmail_template').html();
    var compiled_template = _.template(gmail_template);
    var data = {
        count: result_size,
        widget_num: widget_num
    };

    var template_data = compiled_template({data: data});
    $("div#gmail_data_anchor_"+widget_num).append(template_data);

    _.each(result_messages, function(msg) {
        fetch_gmail_email(user_id, msg.id, function(mail, err) {
            if(err) return console.log('Error: ' + err.message);
            $('#gmail_table_data_anchor_' + widget_num).append("<tr><td>"+mail.subject+"</td></tr>");
        })
    });
}

function fetch_unread_email_data(widget_data, cb) {
    gapi.client.load('gmail', 'v1').then(function() {
        var request = gapi.client.gmail.users.messages.list({
            'userId': widget_data.user_id,
            'includeSpamTrash': false,
            'q': 'label:unread label:inbox'
        });
        request.then(function(resp) {
            var result = resp.result;
            cb(widget_data, result, null);
        }, function(reason) {
            cb(widget_data, null, reason.result.error);
        });
    });
}

function fetch_gmail_email(user_id, id, cb) {
    var request = gapi.client.gmail.users.messages.get({
        'id': id,
        'userId': user_id,
    });
    // Step 6: Execute the API request
    request.then(function(resp) {
        var result = resp.result;
        var mail_info = {};
        _.each(result.payload.headers, function(hdr) {
            mail_info[hdr.name.toLowerCase()] = hdr.value;
        });
        cb(mail_info, null);
    }, function(reason) {
        cb(null, reason.result.error);
    });
}
////////// end gmail

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
        var template_data = compiled_template({results: data.query.results.quote});
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
function get_gmail_widget(data) {
    var compiled_template = _.template(gmail_widget_html);
    var template_data = compiled_template({data: data});

    return [wrap_with_li(wrap_with_header(data.user_id, template_data)), 2, 1]
}
$(function(){
    gridster = $(".gridster > ul").gridster({
        widget_margins: [2, 2],
        widget_base_dimensions: [450, 250],
        //max_cols: 10,
        extra_rows: 1,
        draggable: {
            handle: 'header'
        }
    }).data('gridster');

    var widgets = [
        [wrap_with_li(wrap_with_header("Ticker Data", stock_widget_html)), 1, 1],
        [wrap_with_li(wrap_with_header("Scout Calendar", scout_cal_html)), 1, 1]
    ];
    _.each(gmail_widgets, function(gmail_widget) {
        widgets.push(get_gmail_widget(gmail_widget));
    })
    $.each(widgets, function(i, widget){
        gridster.add_widget.apply(gridster, widget)
    });

    var symbols = ['IBM',"BAC","AIZ","UHAL","AEG"];
    generate_stock_widget(symbols);
});
