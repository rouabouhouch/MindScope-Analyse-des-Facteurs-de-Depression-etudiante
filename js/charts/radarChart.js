// js/charts/radarChart.js - Version corrigée et simplifiée

let radarChartInstance = null;

// Initialiser le radar chart
function createRadarChart(container, features) {
    console.log('Création du radar chart...');
    
    const containerElement = document.querySelector(container);
    if (!containerElement) {
        console.error('Conteneur radar non trouvé:', container);
        return;
    }
    
    const width = containerElement.clientWidth;
    const height = containerElement.clientHeight;
    
    // Nettoyer le conteneur
    d3.select(container).selectAll('*').remove();
    
    // S'assurer des dimensions minimales
    if (width < 100 || height < 100) {
        console.warn('Dimensions trop petites pour le radar:', width, height);
        return;
    }
    
    // Taille du radar
    const size = Math.min(width, height) - 80;
    const radius = size / 2;
    
    // Créer le SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'radar-svg');
    
    // Groupe principal centré
    const g = svg.append('g')
        .attr('transform', `translate(${width/2}, ${height/2})`);
    
    // Stocker la configuration
    radarChartInstance = {
        svg,
        g,
        radius,
        width,
        height,
        features: features || [],
        size
    };
    
    // Dessiner la grille vide
    drawRadarGrid();
    
    console.log('Radar chart initialisé avec succès');
    return radarChartInstance;
}

// Mettre à jour le radar avec des données
function updateRadarChart(container, data1, data2, features, title = 'Comparaison') {
    console.log('Mise à jour du radar avec données:', data1, data2);
    
    if (!radarChartInstance) {
        console.error('Radar chart non initialisé');
        return;
    }
    
    const { g, radius, features: featureNames } = radarChartInstance;
    
    // Nettoyer les anciennes données
    g.selectAll('.radar-area').remove();
    g.selectAll('.radar-circle').remove();
    g.selectAll('.radar-point').remove();
    
    // Vérifier les données
    if (!data1 || !features || features.length === 0) {
        console.warn('Données insuffisantes pour le radar');
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', '#64748b')
            .text('Sélectionnez des données à comparer');
        return;
    }
    
    // Nombre de features
    const numFeatures = features.length;
    const angleSlice = (Math.PI * 2) / numFeatures;
    
    // Échelle (0-5 pour nos métriques)
    const scale = d3.scaleLinear()
        .domain([0, 5])
        .range([0, radius]);
    
    // Fonction pour tracer les lignes
    const radarLine = d3.lineRadial()
        .radius(d => scale(d.value))
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed);
    
    // Préparer les données pour le radar
    const prepareRadarData = (data, features) => {
        return features.map((key, i) => ({
            axis: featureNames[i] || key,
            value: typeof data[key] === 'number' ? data[key] : 0,
            originalValue: data[key]
        }));
    };
    
    const radarData1 = prepareRadarData(data1, features);
    const radarData2 = data2 ? prepareRadarData(data2, features) : null;
    
    // Dessiner la première série (remplie)
    const area1 = g.append('path')
        .datum(radarData1)
        .attr('class', 'radar-area radar-series-1')
        .attr('d', radarLine)
        .style('fill', 'rgba(79, 70, 229, 0.2)')
        .style('stroke', '#4f46e5')
        .style('stroke-width', 2)
        .style('fill-opacity', 0.4);
    
    // Ajouter les points pour la série 1
    radarData1.forEach((d, i) => {
        const angle = i * angleSlice;
        const pointRadius = scale(d.value);
        const x = pointRadius * Math.sin(angle);
        const y = pointRadius * -Math.cos(angle);
        
        g.append('circle')
            .attr('class', 'radar-point')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 4)
            .style('fill', '#4f46e5')
            .style('stroke', 'white')
            .style('stroke-width', 2);
    });
    
    // Dessiner la deuxième série si disponible
    if (radarData2) {
        const area2 = g.append('path')
            .datum(radarData2)
            .attr('class', 'radar-area radar-series-2')
            .attr('d', radarLine)
            .style('fill', 'rgba(245, 158, 11, 0.1)')
            .style('stroke', '#f59e0b')
            .style('stroke-width', 2)
            .style('stroke-dasharray', '5,3');
        
        // Points pour la série 2
        radarData2.forEach((d, i) => {
            const angle = i * angleSlice;
            const pointRadius = scale(d.value);
            const x = pointRadius * Math.sin(angle);
            const y = pointRadius * -Math.cos(angle);
            
            g.append('circle')
                .attr('class', 'radar-point')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 4)
                .style('fill', '#f59e0b')
                .style('stroke', 'white')
                .style('stroke-width', 2);
        });
    }
    
    // Ajouter les labels des axes si pas déjà présents
    if (g.selectAll('.radar-label').empty()) {
        features.forEach((label, i) => {
            const angle = i * angleSlice;
            const labelRadius = radius + 25;
            const x = labelRadius * Math.sin(angle);
            const y = labelRadius * -Math.cos(angle);
            
            // Formatage du label
            const formattedLabel = label
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
            
            g.append('text')
                .attr('class', 'radar-label')
                .attr('x', x)
                .attr('y', y)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '11px')
                .style('fill', '#475569')
                .style('font-weight', '500')
                .text(formattedLabel);
        });
    }
    
    // Titre
    g.append('text')
        .attr('class', 'radar-title')
        .attr('x', 0)
        .attr('y', -radius - 35)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', '#1e293b')
        .text(title);
    
    // Légende
    const legend = g.append('g')
        .attr('class', 'radar-legend')
        .attr('transform', `translate(${-radius + 20}, ${radius + 30})`);
    
    // Série 1
    legend.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 6)
        .style('fill', '#4f46e5');
    
    legend.append('text')
        .attr('x', 15)
        .attr('y', 4)
        .style('font-size', '12px')
        .style('fill', '#475569')
        .text(getSeriesLabel('series1', title));
    
    // Série 2 si disponible
    if (data2) {
        legend.append('circle')
            .attr('cx', 120)
            .attr('cy', 0)
            .attr('r', 6)
            .style('fill', '#f59e0b');
        
        legend.append('text')
            .attr('x', 135)
            .attr('y', 4)
            .style('font-size', '12px')
            .style('fill', '#475569')
            .text(getSeriesLabel('series2', title));
    }
}

// Obtenir le label de la série
function getSeriesLabel(series, title) {
    if (title.includes('Cluster vs Global')) {
        return series === 'series1' ? 'Cluster' : 'Moyenne Globale';
    } else if (title.includes('Étudiant vs Cluster')) {
        return series === 'series1' ? 'Étudiant' : 'Moyenne Cluster';
    } else if (title.includes('Deux Clusters')) {
        return series === 'series1' ? 'Cluster 1' : 'Cluster 2';
    }
    return series === 'series1' ? 'Série 1' : 'Série 2';
}

// Dessiner la grille du radar
function drawRadarGrid() {
    if (!radarChartInstance) return;
    
    const { g, radius } = radarChartInstance;
    
    // Nettoyer l'ancienne grille
    g.selectAll('.radar-circle-grid').remove();
    g.selectAll('.radar-axis').remove();
    
    // 5 niveaux concentriques
    const levels = 5;
    const levelRadius = radius / levels;
    
    // Cercles concentriques
    for (let i = 1; i <= levels; i++) {
        const currentRadius = levelRadius * i;
        
        g.append('circle')
            .attr('class', 'radar-circle-grid')
            .attr('r', currentRadius)
            .style('fill', 'none')
            .style('stroke', '#e2e8f0')
            .style('stroke-width', 1)
            .style('stroke-dasharray', i === levels ? 'none' : '2,2');
        
        // Labels des niveaux (à droite du niveau)
        if (i < levels) {
            g.append('text')
                .attr('class', 'radar-level-label')
                .attr('x', currentRadius + 5)
                .attr('y', -5)
                .style('font-size', '10px')
                .style('fill', '#94a3b8')
                .text(i);
        }
    }
    
    // Axes (lignes du centre vers l'extérieur)
    if (radarChartInstance.features && radarChartInstance.features.length > 0) {
        const numFeatures = radarChartInstance.features.length;
        const angleSlice = (Math.PI * 2) / numFeatures;
        
        for (let i = 0; i < numFeatures; i++) {
            const angle = i * angleSlice;
            const x = radius * Math.sin(angle);
            const y = radius * -Math.cos(angle);
            
            g.append('line')
                .attr('class', 'radar-axis')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .style('stroke', '#cbd5e1')
                .style('stroke-width', 1);
        }
    }
}

// Exporter le radar
function exportRadarChart(format, filename = 'radar-comparaison') {
    if (!radarChartInstance) return;
    
    const svgElement = radarChartInstance.svg.node();
    exportChart(svgElement, format, filename);
}

// Mettre à jour le radar pour un cluster
function updateRadarForCluster(clusterData) {
    if (!clusterData || clusterData.length === 0) return;
    
    // Calculer les moyennes du cluster
    const clusterMeans = calculateClusterMeans(clusterData);
    const globalMeans = calculateGlobalMeans();
    
    const title = `Cluster ${currentSelection.cluster + 1} vs Moyenne Globale`;
    updateRadarChart('#profile-radar', clusterMeans, globalMeans, CONFIG.featureKeys, title);
}

// Mettre à jour le radar pour un étudiant
function updateRadarForStudent(student) {
    if (!student) return;
    
    const clusterData = processedData.filter(d => d.cluster_id === student.cluster_id);
    const clusterMeans = calculateClusterMeans(clusterData);
    
    const title = `Étudiant #${student.id} vs Son Cluster`;
    updateRadarChart('#profile-radar', student, clusterMeans, CONFIG.featureKeys, title);
}

// Calculer les moyennes d'un cluster
function calculateClusterMeans(clusterData) {
    const means = {};
    CONFIG.featureKeys.forEach(key => {
        const values = clusterData.map(d => d[key]).filter(v => v != null);
        means[key] = values.length > 0 ? d3.mean(values) : 0;
    });
    return means;
}

// Calculer les moyennes globales
function calculateGlobalMeans() {
    const means = {};
    CONFIG.featureKeys.forEach(key => {
        const values = processedData.map(d => d[key]).filter(v => v != null);
        means[key] = values.length > 0 ? d3.mean(values) : 0;
    });
    return means;
}