// js/charts/smallMultiples.js - Version corrigée

const CLUSTER_COLORS = ['#4E79A7', '#F28E2C', '#E15759', '#76B7B2', '#59A14F'];

function createSmallMultiples(container, data, clusters, variable) {
    const containerElement = document.querySelector(container);
    if (!containerElement) {
        console.error('Conteneur non trouvé:', container);
        return;
    }
    
    const width = containerElement.clientWidth;
    const height = containerElement.clientHeight;
    
    // Nettoyer le conteneur
    d3.select(container).selectAll('*').remove();
    
    // Vérifier les données
    if (!data || data.length === 0 || !clusters || clusters.length === 0) {
        d3.select(container)
            .append('div')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', '#666')
            .text('Aucune donnée disponible pour les distributions');
        return;
    }
    
    // Calculer les dimensions
    const numClusters = clusters.length;
    const cols = Math.ceil(Math.sqrt(numClusters));
    const rows = Math.ceil(numClusters / cols);
    const chartWidth = Math.max(100, (width - 40) / cols);
    const chartHeight = Math.max(100, (height - 40) / rows);
    
    // Créer le SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(20, 40)');
    
    // Créer les sous-graphiques
    for (let i = 0; i < numClusters; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * chartWidth;
        const y = row * chartHeight;
        
        const clusterGroup = svg.append('g')
            .attr('transform', `translate(${x}, ${y})`);
        
        // Extraire les données du cluster
        const clusterData = clusters[i] || [];
        
        // Vérifier si le cluster a des données
        if (clusterData.length === 0) {
            clusterGroup.append('text')
                .attr('x', chartWidth / 2)
                .attr('y', chartHeight / 2)
                .attr('text-anchor', 'middle')
                .style('fill', '#666')
                .text(`Cluster ${i + 1}\nAucune donnée`);
            continue;
        }
        
        // Extraire les valeurs pour la variable
        const values = clusterData
            .map(d => {
                const val = d[variable];
                // Convertir en nombre, retourner 0 si invalide
                if (val === undefined || val === null) return 0;
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            })
            .filter(v => !isNaN(v));
        
        // Vérifier s'il y a des valeurs
        if (values.length === 0) {
            clusterGroup.append('text')
                .attr('x', chartWidth / 2)
                .attr('y', chartHeight / 2)
                .attr('text-anchor', 'middle')
                .style('fill', '#666')
                .text(`Cluster ${i + 1}\nDonnées manquantes`);
            continue;
        }
        
        // Calculer les statistiques avec vérification
        const mean = values.length > 0 ? d3.mean(values) : 0;
        const median = values.length > 0 ? d3.median(values) : 0;
        const std = values.length > 0 ? d3.deviation(values) : 0;
        const min = values.length > 0 ? d3.min(values) : 0;
        const max = values.length > 0 ? d3.max(values) : 0;
        
        // S'assurer que les valeurs sont valides
        const safeMin = isNaN(min) ? 0 : min;
        const safeMax = isNaN(max) || max === safeMin ? safeMin + 1 : max;
        
        // Échelles
        const xScale = d3.scaleLinear()
            .domain([safeMin, safeMax])
            .range([0, chartWidth - 40]);
        
        // Histogramme
        const histogram = d3.bin()
            .domain(xScale.domain())
            .thresholds(10)(values);
        
        // Trouver la hauteur maximale
        const maxCount = d3.max(histogram, d => d.length) || 1;
        const yScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([chartHeight - 60, 0]);
        
        // Dessiner l'histogramme
        clusterGroup.selectAll('.bar')
            .data(histogram)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.x0))
            .attr('y', d => yScale(d.length))
            .attr('width', d => Math.max(1, xScale(d.x1) - xScale(d.x0) - 2))
            .attr('height', d => yScale(0) - yScale(d.length))
            .attr('fill', CLUSTER_COLORS[i % CLUSTER_COLORS.length])
            .attr('opacity', 0.6);
        
        // Ligne de la moyenne
        if (!isNaN(mean)) {
            clusterGroup.append('line')
                .attr('class', 'mean-line')
                .attr('x1', xScale(mean))
                .attr('x2', xScale(mean))
                .attr('y1', yScale(0))
                .attr('y2', yScale(maxCount))
                .attr('stroke', '#dc2626')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '4,4');
        }
        
        // Titre du cluster
        clusterGroup.append('text')
            .attr('class', 'cluster-title')
            .attr('x', 0)
            .attr('y', -15)
            .style('font-size', '11px')
            .style('font-weight', '600')
            .text(`Cluster ${i + 1} (n=${clusterData.length})`);
        
        // Statistiques
        const stats = [
            { label: 'Moyenne', value: mean },
            { label: 'Médiane', value: median },
            { label: 'Écart-type', value: std },
            { label: 'Min', value: min },
            { label: 'Max', value: max }
        ];
        
        // Afficher les statistiques
        stats.forEach((stat, index) => {
            const value = typeof stat.value === 'number' && !isNaN(stat.value) 
                ? stat.value.toFixed(2) 
                : 'N/A';
            
            clusterGroup.append('text')
                .attr('x', chartWidth - 10)
                .attr('y', 15 + index * 12)
                .attr('text-anchor', 'end')
                .style('font-size', '9px')
                .style('fill', '#64748b')
                .text(`${stat.label}: ${value}`);
        });
        
        // Axe X simple
        clusterGroup.append('line')
            .attr('x1', 0)
            .attr('x2', chartWidth - 40)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0))
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);
    }
    
    // Titre global
    svg.append('text')
        .attr('x', (width - 40) / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text(`Distribution de ${getVariableLabel(variable)} par Cluster`);
}

function getVariableLabel(variable) {
    const labels = {
        'sleep_duration': 'Durée de Sommeil',
        'academic_pressure': 'Pression Académique',
        'financial_stress': 'Stress Financier',
        'study_satisfaction': 'Satisfaction Études',
        'dietary_habits': 'Habitudes Alimentaires',
        'work_study_hours': 'Heures d\'Étude/Travail',
        'cgpa': 'CGPA'
    };
    return labels[variable] || variable;
}