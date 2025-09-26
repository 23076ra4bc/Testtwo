class GitHubFriendlyStorage {
    static async saveData(data) {
        // For GitHub Pages, we can only use localStorage
        const result = this.saveToLocalStorage(data);
        
        // Try external backup (optional)
        const externalResult = await this.tryExternalBackup(data);
        
        return {
            local: result.success,
            external: externalResult.success,
            timestamp: result.timestamp
        };
    }

    static saveToLocalStorage(data) {
        const timestamp = Date.now();
        const key = `visitor_${timestamp}`;
        
        try {
            // Check storage quota
            const dataSize = JSON.stringify(data).length;
            if (dataSize > 5000000) { // 5MB limit
                throw new Error('Data too large for localStorage');
            }
            
            localStorage.setItem(key, JSON.stringify(data));
            return { success: true, key, timestamp };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async tryExternalBackup(data) {
        // For GitHub Pages, we'll use a simple approach
        // Create a downloadable data URL instead of external API
        try {
            const dataStr = JSON.stringify(data, null, 2);
            const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            return {
                success: true,
                url: dataUrl,
                method: 'dataURL'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static getAllLocalData() {
        const visitors = [];
        
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('visitor_')) {
                    try {
                        const item = localStorage.getItem(key);
                        if (item) {
                            const data = JSON.parse(item);
                            const timestamp = parseInt(key.split('_')[1]);
                            
                            visitors.push({
                                key: key,
                                data: data,
                                timestamp: timestamp,
                                date: new Date(timestamp)
                            });
                        }
                    } catch (parseError) {
                        console.warn('Error parsing:', key, parseError);
                    }
                }
            }
            
            return visitors.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error reading localStorage:', error);
            return [];
        }
    }

    static exportData() {
        try {
            const visitors = this.getAllLocalData();
            const exportData = {
                exportedAt: new Date().toISOString(),
                totalVisitors: visitors.length,
                visitors: visitors
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `visitor_data_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return { success: true, count: visitors.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async importData(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    let importedCount = 0;
                    
                    if (importedData.visitors && Array.isArray(importedData.visitors)) {
                        importedData.visitors.forEach(visitor => {
                            if (visitor.key && visitor.data) {
                                localStorage.setItem(visitor.key, JSON.stringify(visitor.data));
                                importedCount++;
                            }
                        });
                    }
                    
                    resolve({ success: true, count: importedCount });
                } catch (error) {
                    resolve({ success: false, error: error.message });
                }
            };
            
            reader.onerror = () => {
                resolve({ success: false, error: 'File reading failed' });
            };
            
            reader.readAsText(file);
        });
    }

    static clearAllData() {
        try {
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('visitor_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            return { success: true, removed: keysToRemove.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static getStorageInfo() {
        const visitors = this.getAllLocalData();
        let totalSize = 0;
        
        visitors.forEach(visitor => {
            totalSize += JSON.stringify(visitor.data).length;
        });
        
        return {
            totalVisitors: visitors.length,
            totalSize: totalSize,
            sizeKB: (totalSize / 1024).toFixed(2),
            sizeMB: (totalSize / (1024 * 1024)).toFixed(2)
        };
    }
}