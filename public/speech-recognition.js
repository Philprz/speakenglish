// Gestionnaire de reconnaissance vocale avec contrôle manuel
class SpeechRecognitionManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.callbacks = {
            onSpeechStart: null,
            onSpeechResult: null,
            onSpeechError: null,
            onSpeechEnd: null
        };
        this.retryCount = 0;
        this.maxRetries = 3;
        this.fallbackMode = false;
        this.manualMode = true; // Mode de contrôle manuel activé par défaut
        this.transcript = ''; // Pour stocker les résultats intermédiaires
    }

    // Vérifier si la reconnaissance vocale est supportée
    static isSupported() {
        return 'webkitSpeechRecognition' in window || 
               'SpeechRecognition' in window || 
               'mozSpeechRecognition' in window || 
               'msSpeechRecognition' in window;
    }

    // Demander la permission d'utiliser le microphone
    static async requestMicrophonePermission() {
        try {
            // Vérifier si le navigateur supporte navigator.mediaDevices
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return {
                    granted: false,
                    error: "Votre navigateur ne supporte pas l'accès au microphone."
                };
            }

            // Vérifier si des appareils audio sont disponibles
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
            
            if (audioInputDevices.length === 0) {
                return {
                    granted: false,
                    error: "Aucun microphone n'a été détecté sur cet appareil."
                };
            }

            // Demander l'accès au microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Arrêter tous les tracks pour libérer le microphone
            stream.getTracks().forEach(track => track.stop());
            
            return {
                granted: true,
                error: null
            };
        } catch (error) {
            console.error("Erreur lors de la demande d'accès au microphone:", error);
            
            let errorMessage = "L'accès au microphone a été refusé.";
            
            if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = "Aucun microphone n'a été détecté sur cet appareil.";
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = "L'accès au microphone a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = "Impossible d'accéder au microphone. Il est peut-être utilisé par une autre application.";
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage = "Aucun microphone compatible n'a été trouvé sur cet appareil.";
            } else if (error.name === 'TypeError') {
                errorMessage = "Paramètres audio incorrects. Veuillez réessayer.";
            }
            
            return {
                granted: false,
                error: errorMessage
            };
        }
    }

    // Initialiser la reconnaissance vocale
    initialize(callbacks) {
        // Enregistrer les callbacks
        if (callbacks) {
            this.callbacks = { ...this.callbacks, ...callbacks };
        }

        try {
            // Créer l'objet de reconnaissance vocale en fonction du navigateur
            if ('webkitSpeechRecognition' in window) {
                this.recognition = new webkitSpeechRecognition();
            } else if ('SpeechRecognition' in window) {
                this.recognition = new SpeechRecognition();
            } else if ('mozSpeechRecognition' in window) {
                this.recognition = new mozSpeechRecognition();
            } else if ('msSpeechRecognition' in window) {
                this.recognition = new msSpeechRecognition();
            } else {
                console.error("La reconnaissance vocale n'est pas supportée par ce navigateur.");
                this.activateFallbackMode();
                return false;
            }

            // Configurer les options de reconnaissance
            this.recognition.continuous = true; // Mode continu pour le contrôle manuel
            this.recognition.interimResults = true; // Résultats intermédiaires pour feedback en temps réel
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            // Configurer les gestionnaires d'événements
            this.setupEventListeners();

            return true;
        } catch (error) {
            console.error("Erreur lors de l'initialisation de la reconnaissance vocale:", error);
            this.activateFallbackMode();
            return false;
        }
    }

    // Configurer les écouteurs d'événements
    setupEventListeners() {
        if (!this.recognition) return;

        // Événement de début de reconnaissance
        this.recognition.onstart = () => {
            this.isListening = true;
            this.transcript = ''; // Réinitialiser le transcript au début
            if (this.callbacks.onSpeechStart) {
                this.callbacks.onSpeechStart();
            }
        };

        // Événement de résultat
        this.recognition.onresult = (event) => {
            // Collecter tous les résultats
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Mettre à jour le transcript global
            this.transcript = finalTranscript || interimTranscript;
            
            // En mode manuel, nous n'envoyons pas encore le résultat final
            // mais nous pouvons envoyer des mises à jour intermédiaires
            if (this.callbacks.onSpeechUpdate) {
                this.callbacks.onSpeechUpdate(this.transcript);
            }
        };

        // Événement d'erreur
        this.recognition.onerror = (event) => {
            console.error("Erreur de reconnaissance vocale:", event.error);
            
            let errorMessage = "Une erreur est survenue lors de la reconnaissance vocale.";
            
            switch (event.error) {
                case 'no-speech':
                    errorMessage = "Aucune parole n'a été détectée. Veuillez réessayer.";
                    break;
                case 'aborted':
                    errorMessage = "La reconnaissance vocale a été interrompue.";
                    break;
                case 'audio-capture':
                    errorMessage = "Impossible de capturer l'audio. Vérifiez votre microphone.";
                    break;
                case 'network':
                    errorMessage = "Problème de réseau. Vérifiez votre connexion internet.";
                    break;
                case 'not-allowed':
                case 'service-not-allowed':
                    errorMessage = "L'accès au microphone a été refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.";
                    break;
                case 'bad-grammar':
                    errorMessage = "Problème avec la grammaire de reconnaissance.";
                    break;
                case 'language-not-supported':
                    errorMessage = "La langue sélectionnée n'est pas supportée.";
                    break;
            }
            
            if (this.callbacks.onSpeechError) {
                this.callbacks.onSpeechError(errorMessage);
            }
            
            // Ne pas arrêter l'écoute en cas d'erreur en mode manuel
            // L'utilisateur décidera quand arrêter
            if (!this.manualMode) {
                this.isListening = false;
            }
        };

        // Événement de fin de reconnaissance
        this.recognition.onend = () => {
            // En mode manuel, nous ne voulons pas que la reconnaissance s'arrête automatiquement
            if (this.manualMode && this.isListening) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error("Erreur lors du redémarrage de la reconnaissance vocale:", error);
                    this.isListening = false;
                    if (this.callbacks.onSpeechEnd) {
                        this.callbacks.onSpeechEnd(true);
                    }
                }
            } else {
                this.isListening = false;
                if (this.callbacks.onSpeechEnd) {
                    this.callbacks.onSpeechEnd(false);
                }
            }
        };
    }

    // Vérifier l'accès au microphone spécifiquement pour Chrome
    async checkMicrophoneAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error("Erreur lors de la vérification de l'accès au microphone:", error);
            this.stopListening();
            
            if (this.callbacks.onSpeechError) {
                this.callbacks.onSpeechError("Problème d'accès au microphone. Veuillez vérifier les permissions.");
            }
        }
    }

    // Démarrer l'écoute
    startListening() {
        if (this.fallbackMode) {
            this.simulateSpeechRecognition();
            return true;
        }

        if (!this.recognition) {
            if (this.initialize(this.callbacks)) {
                try {
                    this.recognition.start();
                    return true;
                } catch (error) {
                    console.error("Erreur lors du démarrage de la reconnaissance vocale:", error);
                    this.retryRecognition();
                    return false;
                }
            } else {
                return false;
            }
        }

        if (this.isListening) {
            // En mode manuel, si on clique à nouveau sur le bouton, on considère que c'est pour arrêter
            if (this.manualMode) {
                this.stopListening();
                // Envoyer le résultat final
                if (this.callbacks.onSpeechResult) {
                    this.callbacks.onSpeechResult(this.transcript, 0.9);
                }
                return false;
            } else {
                this.stopListening();
            }
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            console.error("Erreur lors du démarrage de la reconnaissance vocale:", error);
            
            // Tenter de réinitialiser et réessayer
            if (error.name === 'InvalidStateError') {
                this.recognition = null;
                return this.startListening();
            }
            
            this.retryRecognition();
            return false;
        }
    }

    // Arrêter l'écoute
    stopListening() {
        if (this.fallbackMode) {
            this.isListening = false;
            if (this.callbacks.onSpeechEnd) {
                this.callbacks.onSpeechEnd(false);
            }
            return;
        }

        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error("Erreur lors de l'arrêt de la reconnaissance vocale:", error);
                
                // Réinitialiser en cas d'erreur
                this.recognition = null;
                this.isListening = false;
                
                if (this.callbacks.onSpeechEnd) {
                    this.callbacks.onSpeechEnd(true);
                }
            }
        }
    }

    // Réessayer la reconnaissance après une erreur
    retryRecognition() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Tentative de reconnexion ${this.retryCount}/${this.maxRetries}...`);
            
            // Réinitialiser l'objet de reconnaissance
            this.recognition = null;
            
            // Attendre un peu avant de réessayer
            setTimeout(() => {
                if (this.initialize(this.callbacks)) {
                    try {
                        this.recognition.start();
                    } catch (error) {
                        console.error("Erreur lors de la nouvelle tentative:", error);
                        
                        if (this.retryCount >= this.maxRetries) {
                            this.activateFallbackMode();
                        } else {
                            this.retryRecognition();
                        }
                    }
                } else {
                    this.activateFallbackMode();
                }
            }, 1000);
        } else {
            this.activateFallbackMode();
        }
    }

    // Activer le mode de secours
    activateFallbackMode() {
        console.log("Activation du mode de secours pour la reconnaissance vocale");
        this.fallbackMode = true;
        
        if (this.callbacks.onSpeechError) {
            this.callbacks.onSpeechError("La reconnaissance vocale n'est pas disponible. Mode de secours activé.");
        }
    }

    // Simuler la reconnaissance vocale en mode de secours
    simulateSpeechRecognition() {
        if (this.callbacks.onSpeechStart) {
            this.callbacks.onSpeechStart();
        }
        
        this.isListening = true;
        
        // Simuler un délai de reconnaissance
        setTimeout(() => {
            if (this.isListening) {
                // Générer une réponse simulée basée sur la question actuelle
                const currentQuestion = document.getElementById('instructionText')?.textContent || 
                                       document.getElementById('questionText')?.textContent || 
                                       "How are you today?";
                
                let simulatedResponse = "";
                
                if (currentQuestion.includes("How are you")) {
                    simulatedResponse = "I'm fine thank you how about you";
                } else if (currentQuestion.includes("name")) {
                    simulatedResponse = "My name is John";
                } else if (currentQuestion.includes("live") || currentQuestion.includes("from")) {
                    simulatedResponse = "I live in New York";
                } else if (currentQuestion.includes("yesterday")) {
                    simulatedResponse = "I went to the cinema yesterday";
                } else if (currentQuestion.includes("tomorrow") || currentQuestion.includes("plans")) {
                    simulatedResponse = "I will go shopping tomorrow";
                } else if (currentQuestion.includes("hobby") || currentQuestion.includes("like")) {
                    simulatedResponse = "I enjoy playing tennis";
                } else {
                    simulatedResponse = "I'm not sure how to answer that question";
                }
                
                if (this.callbacks.onSpeechResult) {
                    this.callbacks.onSpeechResult(simulatedResponse, 0.8);
                }
                
                this.isListening = false;
                
                if (this.callbacks.onSpeechEnd) {
                    this.callbacks.onSpeechEnd(false);
                }
            }
        }, 2000);
    }
}

// Gestionnaire de synthèse vocale
class TextToSpeechManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.utterance = null;
        this.voices = [];
        this.selectedVoice = null;
        this.speaking = false;
    }

    // Initialiser la synthèse vocale
    initialize(callback) {
        if (!this.synthesis) {
            if (callback) callback(false, "La synthèse vocale n'est pas supportée par ce navigateur.");
            return;
        }

        // Charger les voix disponibles
        this.loadVoices();

        // Certains navigateurs (comme Chrome) chargent les voix de manière asynchrone
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices();
                if (callback) callback(true);
            };
        } else {
            if (callback) callback(true);
        }
    }

    // Charger les voix disponibles
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Sélectionner une voix anglaise par défaut
        this.selectedVoice = this.voices.find(voice => 
            voice.lang.includes('en-US') || voice.lang.includes('en-GB')
        );
        
        // Si aucune voix anglaise n'est trouvée, utiliser la première voix disponible
        if (!this.selectedVoice && this.voices.length > 0) {
            this.selectedVoice = this.voices[0];
        }
    }

    // Parler un texte
    speak(text, callback) {
        if (!this.synthesis) {
            if (callback) callback(false, "La synthèse vocale n'est pas supportée par ce navigateur.");
            return;
        }

        // Arrêter toute synthèse vocale en cours
        this.stop();

        // Créer un nouvel objet d'énoncé
        this.utterance = new SpeechSynthesisUtterance(text);
        
        // Configurer la voix
        if (this.selectedVoice) {
            this.utterance.voice = this.selectedVoice;
        }
        
        // Configurer les propriétés de la voix
        this.utterance.rate = 0.9;  // Légèrement plus lent pour une meilleure compréhension
        this.utterance.pitch = 1.0;
        this.utterance.volume = 1.0;
        
        // Configurer les gestionnaires d'événements
        this.utterance.onstart = () => {
            this.speaking = true;
        };
        
        this.utterance.onend = () => {
            this.speaking = false;
            if (callback) callback(true);
        };
        
        this.utterance.onerror = (event) => {
            this.speaking = false;
            if (callback) callback(false, `Erreur de synthèse vocale: ${event.error}`);
        };
        
        // Démarrer la synthèse vocale
        this.synthesis.speak(this.utterance);
    }

    // Arrêter la synthèse vocale
    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.speaking = false;
        }
    }

    // Vérifier si la synthèse vocale est en cours
    isCurrentlySpeaking() {
        return this.speaking;
    }
}
