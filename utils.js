var notify = function (title, msg) {
    return chrome.notifications.create('', {
        type: "basic",
        title: title,
        message: msg,
        iconUrl: "icon.png"
    }, function (notifid) {});
},
get_multiplier = function () {
    var value = store.get('multiplier');
    if (value === undefined) {
        return 1;
    }
    return value;
},
set_multiplier = function (value) {
    value = parseFloat(value);
    if (isNaN(value)) {
        value = 1;
    }
    store.set('multiplier', value);
},
get_last_value = function () {
    return store.get('last-value');
},
set_last_value = function (value) {
    store.set('last-value', value);
},
get_precision = function () {
    var value = store.get('precision');
    if (value === undefined) {
        return 1;
    }
    return value;
},
set_precision = function (value) {
    value = parseInt(value, 10);
    if (isNaN(value)) {
        value = 1;
    }
    store.set('precision', value);
},
reload_badge = function () {
    $.getJSON("https://www.bitstamp.net/api/ticker/", function (data) {
        if (!data && !data.last) {
            return;
        }
        var value = parseFloat(data.last),
            last_value = get_last_value() || value,
            last_max = store.get('last_max') || value,
            last_min = store.get('last_min') || value,
            badge_value = value * get_multiplier();
        if (value == last_value) {
            chrome.browserAction.setBadgeBackgroundColor({
                color: [0, 0, 0, 150]
            });
        } else if (value > last_value) {
            chrome.browserAction.setBadgeBackgroundColor({
                color: [0, 150, 0, 150]
            });
        } else {
            chrome.browserAction.setBadgeBackgroundColor({
                color: [255, 0, 0, 255]
            });
        }
        chrome.browserAction.setTitle({
            'title': '1 BTC = ' + value.toFixed(2) + ' USD'
        });
        chrome.browserAction.setBadgeText({
            'text': badge_value.toFixed(get_precision())
        });
        set_last_value(value);
        if (value > last_max) {
            store.set('last_max', value);
            if (store.get('notification-max')) {
                notify('New maximum BTC price', 'The highest price is now ' + value);
            }
        }
        if (value < last_min) {
            store.set('last_min', value);
            if (store.get('notification-min')) {
                notify('New minimum BTC price', 'The lowest price is now ' + value);
            }
        }
    });
},
save_options = function () {
    var multiplier = $('#multiplier').val(),
        precision = $('#precision option:selected').val();
    set_multiplier(multiplier);
    set_precision(precision);
    $('input[type=checkbox]').each(function () {
        var elem = $(this),
            id = elem.attr('id'),
            checked = elem.prop('checked');
        store.set(id, checked);
    });
    reload_badge();
},
load_options = function () {
    $('#multiplier').val(get_multiplier());
    $('#precision option[value=' + get_precision() + ']').prop('selected', true);
    $('input[type=checkbox]').each(function () {
        var elem = $(this),
            id = elem.attr('id'),
            checked = store.get(id);
        elem.prop('checked', checked);
    });
    $('#save').on('click', save_options);
},
background = function () {
    chrome.browserAction.onClicked.addListener(function (tab) {
        chrome.browserAction.setBadgeBackgroundColor({
            color: [255, 0, 0, 255]
        });
        chrome.browserAction.setBadgeText({
            'text': '...'
        });
        reload_badge();
    });
    setInterval(reload_badge, 60000);
    reload_badge();
};
