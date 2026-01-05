// js/charts/heatmap.js - Version corrigée (partie critique)

function createCorrelationHeatmap(container, data, labels) {
    const containerEl = document.querySelector(container);
    if (!containerEl) {
        console.error('Conteneur heatmap non trouvé:', container);
        return;
    }
    
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;
    
    // Nettoyer le conteneur
    d3.select(container).selectAll('*').remove();
    
    if (!data || data.length === 0 || !labels || labels.length === 0) {
        // Message si pas de données
        d3.select(container)
            .append('div')
            .style('text-align', 'center')
            .style('padding', '40px')
            .style('color', '#64748b')
            .html(`
                <p style="margin-bottom: 10px;">📊 Matrice de Corrélation</p>
                <p style="font-size: 12px;">Sélectionnez un cluster pour voir les corrélations</p>
            `);
        return;
    }
    
    // Marges adaptatives selon la taille
    const margin = { 
        top: Math.min(60, height * 0.15), 
        right: Math.min(30, width * 0.1), 
        bottom: Math.min(80, height * 0.2), 
        left: Math.min(80, width * 0.2) 
    };
    
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(100, height - margin.top - margin.bottom);
    
    // Taille de cellule adaptative
    const cellSize = Math.min(
        innerWidth / data.length,
        innerHeight / data[0].length,
        50 // Taille max
    );
    
    // Créer le SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'heatmap-svg');
    
    // Groupe principal
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Échelle de couleur améliorée
    const colorScale = d3.scaleDiverging()
        .domain([-1, 0, 1])
        .interpolator(d3.interpolateRdBu);
    
    // Créer les cellules
    const cells = g.selectAll('.heatmap-cell')
        .data(data.flatMap((row, i) => 
            row.map((value, j) => ({ 
                x: i, 
                y: j, 
                value: Math.min(1, Math.max(-1, value)), // Clamper entre -1 et 1
                labelX: labels?.[i] || `F${i}`,
                labelY: labels?.[j] || `F${j}`,
                absValue: Math.abs(value)
            }))
        ))
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', d => d.x * cellSize)
        .attr('y', d => d.y * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);
    
    // Labels X (en bas) - FORMATÉS POUR ÉVITER LES SUPERPOSITIONS
    g.selectAll('.x-label')
        .data(labels)
        .enter()
        .append('text')
        .attr('class', 'x-label')
        .attr('x', (d, i) => i * cellSize + cellSize / 2)
        .attr('y', innerHeight + 20)
        .attr('text-anchor', 'middle')
        .style('font-size', Math.min(11, cellSize / 5) + 'px')
        .style('fill', '#475569')
        .style('font-weight', '500')
        .text(d => formatLabel(d, cellSize));
    
    // Labels Y (à gauche) - FORMATÉS POUR ÉVITER LES SUPERPOSITIONS
    g.selectAll('.y-label')
        .data(labels)
        .enter()
        .append('text')
        .attr('class', 'y-label')
        .attr('x', -10)
        .attr('y', (d, i) => i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', Math.min(11, cellSize / 5) + 'px')
        .style('fill', '#475569')
        .style('font-weight', '500')
        .text(d => formatLabel(d, cellSize));
    
    // Tooltip
    const tooltip = d3.select(container)
        .append('div')
        .attr('class', 'heatmap-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(255, 255, 255, 0.98)')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 20px rgba(0,0,0,0.15)')
        .style('border', '1px solid #e2e8f0')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('z-index', '1000')
        .style('min-width', '200px')
        .style('max-width', '300px');
    
    // Événements sur les cellules
    cells.on('mouseover', function(event, d) {
        d3.select(this)
            .attr('stroke', '#1e293b')
            .attr('stroke-width', 2);
        
        tooltip
            .style('display', 'block')
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(`
                <div style="margin-bottom: 8px; font-weight: 600; color: #1e293b;">
                    Corrélation
                </div>
                <div style="margin-bottom: 6px; color: #475569;">
                    <strong>${formatLabel(d.labelX, 100)}</strong> ↔ 
                    <strong>${formatLabel(d.labelY, 100)}</strong>
                </div>
                <div style="margin-bottom: 8px;">
                    <span style="display: inline-block; padding: 4px 8px; background: ${colorScale(d.value)}; 
                           color: ${Math.abs(d.value) > 0.5 ? 'white' : '#1e293b'}; 
                           border-radius: 4px; font-weight: 600;">
                        ${d.value.toFixed(3)}
                    </span>
                </div>
                <div style="color: #64748b; font-size: 12px;">
                    ${getCorrelationStrength(d.value)}
                </div>
            `);
    })
    .on('mouseout', function() {
        d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        tooltip.style('display', 'none');
    });
    
    // Titre centré
    svg.append('text')
        .attr('class', 'heatmap-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', '#1e293b')
        .text('Matrice de Corrélation');
}

// Formater les labels pour éviter les superpositions
function formatLabel(label, cellSize) {
    if (!label) return '';
    
    // Raccourcir les labels longs
    const maxLength = Math.floor(cellSize / 6);
    if (label.length > maxLength && maxLength > 3) {
        return label.substring(0, maxLength - 3) + '...';
    }
    
    // Formatter les noms de variables
    return label
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// ... le reste des fonctions (getCorrelationStrength, etc.) reste identique ...

// Obtenir la force de la corrélation
function getCorrelationStrength(value) {
    const absValue = Math.abs(value);
    if (absValue >= 0.7) return 'Corrélation forte';
    if (absValue >= 0.3) return 'Corrélation modérée';
    if (absValue >= 0.1) return 'Corrélation faible';
    return 'Pas de corrélation significative';
}