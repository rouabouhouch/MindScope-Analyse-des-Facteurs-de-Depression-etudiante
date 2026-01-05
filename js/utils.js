
var Utils = {
    // Convertir les valeurs catégorielles en scores numériques

    mapScore: function(value) {
        if (value === undefined || value === null || value === '') return 3;
        
        const mapping = {
            // Stress/Niveaux
            'Low': 1, 'Moderate': 3, 'High': 5,
            'Very Low': 1, 'Very High': 5,
            
            // Habitudes alimentaires
            'Unhealthy': 1, 'Moderate': 3, 'Healthy': 5,
            
            // Durée de sommeil
            'Less than 5 hours': 1,
            '5-6 hours': 2,
            '7-8 hours': 4,
            'More than 8 hours': 5,
            
            // Satisfaction
            'Very Dissatisfied': 1,
            'Dissatisfied': 2,
            'Neutral': 3,
            'Satisfied': 4,
            'Very Satisfied': 5
        };
        
        return mapping[value] || (isNaN(value) ? 3 : +value);
    },
    // Normaliser entre 0 et 1
    normalize: function(value, min, max) {
        if (max === min) return 0.5;
        return (value - min) / (max - min);
    },
    
    // Calculer des moyennes pondérées
    calculateWeightedAverage: function(data, features, weights) {
        const averages = {};
        features.forEach((f, i) => {
            const weight = weights?.[i] || 1;
            const values = data.map(d => d[f]).filter(v => v !== undefined);
            averages[f] = values.length > 0 ? 
                d3.mean(values) * weight : 0;
        });
        return averages;
    },
    
    // Formater les nombres
    formatNumber: function(num, decimals = 2) {
        return num.toFixed(decimals);
    },
    
    // Calculer le pourcentage
    calculatePercentage: function(part, total) {
        if (total === 0) return 0;
        return (part / total) * 100;
    },
    
    // Obtenir le nom du cluster
    getClusterName: function(clusterId) {
        const names = [
            'Résilients',
            'À Risque Modéré',
            'Haut Risque',
            'Équilibre Précaire',
            'Performants Stressés'
        ];
        return names[clusterId] || `Cluster ${clusterId + 1}`;
    },
    
    // Obtenir la couleur du cluster
    getClusterColor: function(clusterId) {
        const colors = ['#4E79A7', '#F28E2C', '#E15759', '#76B7B2', '#59A14F'];
        return colors[clusterId % colors.length];
    },
    
    // Générer un ID unique
    generateId: function() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
};

// Fonction d'export de graphique
function exportChart(chartId, format, filename) {
    const svgElement = document.querySelector(`#${chartId} svg`);
    if (!svgElement) {
        console.error("SVG element not found for export:", chartId);
        return;
    }
    
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgElement);
    
    // Ajouter les styles
    const style = document.createElement('style');
    style.innerHTML = `
        .data-point { cursor: pointer; }
        .radar-area { fill-opacity: 0.3; }
        .tooltip { font-family: 'Inter', sans-serif; }
    `;
    
    svgString = svgString.replace('<svg', `<svg>${serializer.serializeToString(style)}`);
    
    if (format === "svg") {
        const blob = new Blob([svgString], {type: "image/svg+xml"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (format === "png") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        
        const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
            ctx.drawImage(img, 0, 0);
            
            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = pngUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = (error) => {
            console.error("Error loading SVG for PNG export:", error);
            alert("Erreur lors de l'export PNG. L'export SVG est recommandé.");
        };
        
        img.src = url;
    }
}

// Fonction pour télécharger les données
function downloadData(data, filename = 'data.json') {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Fonction pour copier dans le presse-papier
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            console.log('Copied to clipboard');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
        });
}

// Fonction de débogage
function debugLog(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] ${message}`, data);
    }
}
if (typeof window.CLUSTER_COLORS === 'undefined') {
    window.CLUSTER_COLORS = [
        '#4E79A7', // Bleu - Cluster 1
        '#F28E2C', // Orange - Cluster 2
        '#E15759', // Rouge - Cluster 3
        '#76B7B2', // Vert-bleu - Cluster 4
        '#59A14F', // Vert - Cluster 5
        '#EDC949', // Jaune - Cluster 6
        '#AF7AA1', // Violet - Cluster 7
        '#FF9DA7'  // Rose - Cluster 8
    ];
}