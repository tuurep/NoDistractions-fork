export default {
    createNotification(name, alertmessage, iconEnabled) {
        let icon = "/static/assets/icon-low.png";
        
        if (iconEnabled) {
            icon = "/static/assets/icon-enabled-low.png";
        }

        browser.notifications.create(name, {
            type: "basic",
            iconUrl: icon,
            title: "NoDistractions",
            message: alertmessage
        });
    }
};
