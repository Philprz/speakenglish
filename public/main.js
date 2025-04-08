// Fichier principal pour la gestion de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Récupération des boutons de la page d'accueil
    const startButton = document.getElementById('startButton');
    const evaluationButton = document.getElementById('evaluationButton');
    const practiceButton = document.getElementById('practiceButton');
    const settingsButton = document.getElementById('settingsButton');

    // Ajout des écouteurs d'événements pour la navigation
    if (startButton) {
        startButton.addEventListener('click', function() {
            window.location.href = 'learning.html';
        });
    }

    if (evaluationButton) {
        evaluationButton.addEventListener('click', function() {
            window.location.href = 'evaluation.html';
        });
    }

    if (practiceButton) {
        practiceButton.addEventListener('click', function() {
            window.location.href = 'learning.html';
        });
    }

    if (settingsButton) {
        settingsButton.addEventListener('click', function() {
            alert('Les paramètres seront disponibles dans une prochaine version.');
        });
    }

    // Vérification de la compatibilité de la reconnaissance vocale
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Votre navigateur ne supporte pas la reconnaissance vocale. Veuillez utiliser Chrome, Edge ou Safari pour une expérience optimale.');
    }
});
