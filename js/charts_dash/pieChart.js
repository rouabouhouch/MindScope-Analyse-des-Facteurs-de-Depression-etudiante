// js/charts_dash/pieChart.js (suite)
// Pie chart de distribution de la dépression

let pieChartInitialized = false;
let pieChart = null;
let selectedCategory = null; // Variable pour suivre la catégorie sélectionnée

function initPieChart() {
    if (pieChartInitialized) return;
    
    const container = d3.select('#depression-pie');
    if (container.empty()) return;
    
    const width = container.node().clientWidth;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 40;
    
    const svg = container
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    pieChart = {
        svg,
        width,
        height,
        radius,
        arc: null,
        pie: null
    };
    
    // Initialiser les fonctions D3
    pieChart.arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    pieChart.pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    // Événement d'export
    document.getElementById('export-pie')?.addEventListener('click', exportPieChart);
    
    // AJOUT : Bouton de description
    if (typeof CommentButton !== 'undefined') {
        CommentButton.attach({
            container: document
                .querySelector('#depression-pie')
                .closest('.chart-card'),
            // push the button further up for this chart so it doesn't overlap the legend
            bottomOffset: 60,
            leftOffset: 12,
            content: `
                <strong>Distribution de la dépression</strong><br/><br/>
                Ce graphique montre la répartition des étudiants
                selon leur statut de dépression.<br/><br/>
                Les valeurs sont recalculées dynamiquement
                selon les filtres sélectionnés.
            `
        });
    }
    
    pieChartInitialized = true;
}

function updatePieChart() {
    if (!pieChartInitialized || !pieChart) return;
    
    const data = getFilteredData();
    const stats = DashboardState.utils.calculateDepressionStats(data);
    
    const pieData = [
        { label: 'Non déprimé', value: stats.notDepressed, color: '#10b981' },
        { label: 'Déprimé', value: stats.depressed, color: '#ef4444' }
    ];
    
    // Nettoyer
    pieChart.svg.selectAll('*').remove();
    
    // Créer les arcs
    const arcs = pieChart.svg.selectAll('.arc')
        .data(pieChart.pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'arc')
        .style('cursor', 'pointer');
    
    // Dessiner les arcs
    arcs.append('path')
        .attr('d', pieChart.arc)
        .attr('fill', d => {
            // Si une catégorie est sélectionnée et ce n'est pas celle-ci, mettre blanc
            if (selectedCategory && d.data.label !== selectedCategory) {
                return '#f1f5f9'; // Blanc grisâtre
            }
            return d.data.color; // Garde la couleur d'origine
        })
        .attr('tabindex', -1)
        .style('opacity', d => {
            // Si sélectionné, plus opaque, sinon normal
            if (selectedCategory && d.data.label === selectedCategory) {
                return 1;
            }
            return 0.8;
        })
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .style('transition', 'fill 0.3s ease, opacity 0.3s ease')
        .on('mouseover', function(event, d) {
            // Si cet élément n'est pas sélectionné, l'agrandir
            if (!selectedCategory || d.data.label !== selectedCategory) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('transform', 'scale(1.05)')
                    .style('opacity', 0.9);
            }
            
            // Afficher le tooltip
            showPieTooltip(event, d, stats.total);
        })
        .on('mouseout', function(event, d) {
            // Si cet élément n'est pas sélectionné, le réduire
            if (!selectedCategory || d.data.label !== selectedCategory) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('transform', 'scale(1)')
                    .style('opacity', selectedCategory ? 0.8 : 0.8);
            }
            
            hideTooltip();
        })
        .on('click', function(event, d) {
            event.preventDefault();
            event.stopPropagation();
            
            const clickedLabel = d.data.label;
            
            // Si on clique sur l'élément déjà sélectionné, désélectionner
            if (selectedCategory === clickedLabel) {
                selectedCategory = null;
                // Réinitialiser le filtre
                if (typeof handleSelection === 'function') {
                    handleSelection('depression', null);
                }
            } else {
                // Sinon, sélectionner cet élément
                selectedCategory = clickedLabel;
                
                // Appliquer le filtre correspondant
                const isDepressed = clickedLabel === 'Déprimé';
                if (typeof handleSelection === 'function') {
                    handleSelection('depression', isDepressed);
                }
            }
            
            // Re-dessiner le graphique avec la nouvelle sélection
            updatePieChart();
        });
    
    // Ajouter des animations pour l'apparition initiale
    arcs.selectAll('path')
        .transition()
        .duration(1000)
        .attrTween('d', function(d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function(t) {
                return pieChart.arc(interpolate(t));
            };
        });
    
    // Ajouter des labels
    arcs.append('text')
        .attr('transform', d => `translate(${pieChart.arc.centroid(d)})`)
        .attr('dy', '.35em')
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', d => {
            // Si cet élément n'est pas sélectionné (blanc), mettre le texte en gris
            if (selectedCategory && d.data.label !== selectedCategory) {
                return '#94a3b8';
            }
            return 'white';
        })
        .style('text-shadow', d => {
            if (selectedCategory && d.data.label !== selectedCategory) {
                return 'none';
            }
            return '1px 1px 2px rgba(0,0,0,0.5)';
        })
        .text(d => {
            if (d.data.value === 0) return '';
            const percentage = (d.data.value / stats.total * 100).toFixed(1);
            return `${percentage}%`;
        });
    
    // // Ajouter un centre avec informations
    // const centerGroup = pieChart.svg.append('g')
    //     .attr('text-anchor', 'middle');
    
    // if (!selectedCategory) {
    //     // Mode normal : afficher le total
    //     centerGroup.append('text')
    //         .attr('dy', '0.35em')
    //         .style('font-size', '18px')
    //         .style('fill', '#1e293b')
    //         .style('font-weight', '700')
    //         .text(stats.total);
            
    //     centerGroup.append('text')
    //         .attr('dy', '1.5em')
    //         .style('font-size', '12px')
    //         .style('fill', '#64748b')
    //         .style('font-weight', '500')
    //         .text('étudiants');
    // } else {
    //     // Mode sélectionné : afficher les détails de la sélection
    //     const selectedData = pieData.find(d => d.label === selectedCategory);
    //     if (selectedData) {
    //         centerGroup.append('text')
    //             .attr('dy', '-0.8em')
    //             .style('font-size', '14px')
    //             .style('fill', selectedData.color)
    //             .style('font-weight', '700')
    //             .text(selectedData.label);
                
    //         centerGroup.append('text')
    //             .attr('dy', '0.8em')
    //             .style('font-size', '20px')
    //             .style('fill', '#1e293b')
    //             .style('font-weight', '700')
    //             .text(selectedData.value);
                
    //         centerGroup.append('text')
    //             .attr('dy', '2.2em')
    //             .style('font-size', '11px')
    //             .style('fill', '#64748b')
    //             .style('font-weight', '500')
    //             .text(`(${((selectedData.value / stats.total) * 100).toFixed(1)}%)`);
    //     }
    // }
    
    // Mettre à jour la légende
    updatePieLegend(pieData, stats);
}

function showPieTooltip(event, d, total) {
    const tooltip = d3.select('#tooltip') || createTooltip();
    
    const percentage = (d.data.value / total * 100).toFixed(1);
    
    tooltip
        .style('display', 'block')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(`
            <div style="padding: 8px;">
                <strong style="color: ${d.data.color}">${d.data.label}</strong><br/>
                <span>Nombre: ${d.data.value} étudiants</span><br/>
                <span>Pourcentage: ${percentage}%</span>
                <br/><br/>
                <small style="color: #64748b;">👆 Cliquer pour filtrer "${d.data.label}"</small>
            </div>
        `);
}

function updatePieLegend(pieData, stats) {
    const legendContainer = d3.select('#pie-legend');
    if (legendContainer.empty()) return;
    
    legendContainer.html('');
    
    const legend = legendContainer
        .append('div')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('gap', '20px')
        .style('font-size', '12px');
    
    pieData.forEach(item => {
        const percentage = (item.value / stats.total * 100).toFixed(1);
        
        const legendItem = legend
            .append('div')
            .attr('class', 'legend-item')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '6px')
            .style('padding', '8px 12px')
            .style('background', selectedCategory === item.label ? '#f1f5f9' : 'transparent')
            .style('border', selectedCategory === item.label ? `2px solid ${item.color}` : '1px solid #e2e8f0')
            .style('border-radius', '6px')
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease')
            .on('mouseover', function() {
                if (selectedCategory !== item.label) {
                    d3.select(this)
                        .style('background', '#f8fafc')
                        .style('transform', 'translateY(-1px)');
                }
            })
            .on('mouseleave', function() {
                if (selectedCategory !== item.label) {
                    d3.select(this)
                        .style('background', selectedCategory === item.label ? '#f1f5f9' : 'transparent')
                        .style('transform', 'translateY(0)');
                }
            })
            .on('click', () => {
                const clickedLabel = item.label;
                
                // Si on clique sur l'élément déjà sélectionné, désélectionner
                if (selectedCategory === clickedLabel) {
                    selectedCategory = null;
                    // Réinitialiser le filtre
                    if (typeof handleSelection === 'function') {
                        handleSelection('depression', null);
                    }
                } else {
                    // Sinon, sélectionner cet élément
                    selectedCategory = clickedLabel;
                    
                    // Appliquer le filtre correspondant
                    const isDepressed = clickedLabel === 'Déprimé';
                    if (typeof handleSelection === 'function') {
                        handleSelection('depression', isDepressed);
                    }
                }
                
                // Re-dessiner le graphique avec la nouvelle sélection
                updatePieChart();
            });
        
        // Indicateur de couleur
        legendItem
            .append('div')
            .style('width', '12px')
            .style('height', '12px')
            .style('background-color', selectedCategory === item.label ? item.color : item.color)
            .style('border-radius', '2px')
            .style('opacity', selectedCategory && selectedCategory !== item.label ? 0.3 : 1)
            .style('transition', 'opacity 0.3s ease');
        
        // Texte
        const textSpan = legendItem
            .append('span')
            .style('color', selectedCategory === item.label ? item.color : '#475569')
            .style('font-weight', selectedCategory === item.label ? '700' : '600')
            .text(`${item.label}: ${item.value} (${percentage}%)`);
    });
    
    // Bouton de réinitialisation si une catégorie est sélectionnée
    if (selectedCategory) {
        const resetButton = legend
            .append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '6px')
            .style('padding', '8px 12px')
            .style('background', '#f1f5f9')
            .style('border', '1px solid #e2e8f0')
            .style('border-radius', '6px')
            .style('cursor', 'pointer')
            .style('color', '#475569')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('transition', 'all 0.2s')
            .on('mouseover', function() {
                d3.select(this)
                    .style('background', '#e2e8f0')
                    .style('transform', 'translateY(-1px)');
            })
            .on('mouseleave', function() {
                d3.select(this)
                    .style('background', '#f1f5f9')
                    .style('transform', 'translateY(0)');
            })
            .on('click', () => {
                selectedCategory = null;
                // Réinitialiser le filtre
                if (typeof handleSelection === 'function') {
                    handleSelection('depression', null);
                }
                updatePieChart();
            });
        
        resetButton
            .append('svg')
            .attr('width', '14')
            .attr('height', '14')
            .style('fill', '#64748b')
            .html('<path d="M10.5 1.5a1.5 1.5 0 1 0-3 0v1.2a6 6 0 1 0 6 0V1.5Z"/>');
        
        resetButton
            .append('span')
            .text('Réinitialiser');
    }
}

// Fonction pour réinitialiser la sélection (peut être appelée depuis d'autres graphiques)
function resetPieSelection() {
    selectedCategory = null;
    if (pieChartInitialized && pieChart) {
        updatePieChart();
    }
}

function exportPieChart() {
    if (!pieChart) return;
    
    const svgNode = pieChart.svg.node().parentNode;
    const svgData = new XMLSerializer().serializeToString(svgNode);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = function() {
        canvas.width = pieChart.width;
        canvas.height = pieChart.height;
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = 'depression-pie-chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function createTooltip() {
    return d3.select('body')
        .append('div')
        .attr('id', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '1px solid #e2e8f0')
        .style('border-radius', '6px')
        .style('padding', '5px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('display', 'none')
        .style('font-size', '12px');
}

function hideTooltip() {
    d3.select('#tooltip').style('display', 'none');
}

// Exposer les fonctions
window.initPieChart = initPieChart;
window.updatePieChart = updatePieChart;
window.resetPieSelection = resetPieSelection; // Exposer pour réinitialisation externe