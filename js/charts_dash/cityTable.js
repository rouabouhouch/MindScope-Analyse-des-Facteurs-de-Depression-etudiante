// js/charts_dash/cityTable.js
// Tableau des villes avec moyennes

let cityTableInitialized = false;
let currentSort = 'city';
let sortOrder = 'asc';

function initCityTable() {
    if (cityTableInitialized) return;
    
    // Événement de tri
    const sortSelect = document.getElementById('table-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            updateCityTable();
        });
    }


    
    cityTableInitialized = true;
}

function updateCityTable() {
    const container = document.getElementById('city-table');
    if (!container) return;
    
    const data = getFilteredData();
    const cityStats = DashboardState.utils.calculateCityStats(data);
    
    // Convertir en tableau et trier
    let tableData = Object.entries(cityStats).map(([city, stats]) => ({
        city,
        avgSatisfaction: stats.avgSatisfaction,
        avgCGPA: stats.avgCGPA,
        count: stats.count,
        depressionRate: stats.depressionRate
    }));
    
    // Trier les données
    tableData.sort((a, b) => {
        let comparison = 0;
        
        switch(currentSort) {
            case 'city':
                comparison = a.city.localeCompare(b.city);
                break;
            case 'satisfaction':
                comparison = b.avgSatisfaction - a.avgSatisfaction;
                break;
            case 'cgpa':
                comparison = b.avgCGPA - a.avgCGPA;
                break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Calculer les totaux
    const totals = {
        city: 'TOTAL',
        avgSatisfaction: d3.mean(tableData, d => d.avgSatisfaction),
        avgCGPA: d3.mean(tableData, d => d.avgCGPA),
        count: d3.sum(tableData, d => d.count),
        depressionRate: d3.mean(tableData, d => d.depressionRate)
    };
    
    // Rendre le tableau
    renderCityTable(tableData, totals);
}

function renderCityTable(data, totals) {
    const container = document.getElementById('city-table');
    container.innerHTML = '';
    
    const table = document.createElement('table');
    
    // En-tête
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Ville</th>
            <th>Nb Étudiants</th>
            <th>Satisfaction (moy)</th>
            <th>CGPA (moy)</th>
            <th>Taux Dépression</th>
        </tr>
    `;
    // Style header cells for a cleaner look
    thead.querySelectorAll('th').forEach((th, i, list) => {
        th.style.background = '#f8fafc';
        th.style.padding = '8px 10px';
        th.style.fontSize = '12px';
        th.style.color = '#475569';
        th.style.fontWeight = '700';
        th.style.borderBottom = '2px solid #e2e8f0';
        if (i === 0) th.style.borderTopLeftRadius = '6px';
        if (i === list.length - 1) th.style.borderTopRightRadius = '6px';
        th.style.textAlign = 'left';
    });
    table.appendChild(thead);
    
    // Corps
    const tbody = document.createElement('tbody');
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => handleSelection('city', row.city);
        tr.innerHTML = `
            <td style="padding:8px 10px;">${row.city}</td>
            <td style="padding:8px 10px;">${row.count}</td>
            <td style="padding:8px 10px;">${row.avgSatisfaction.toFixed(2)}</td>
            <td style="padding:8px 10px;">${row.avgCGPA.toFixed(2)}</td>
            <td style="padding:8px 10px;">${(row.depressionRate * 100).toFixed(1)}%</td>
        `;
        
        tr.onmouseenter = function() {
            this.style.backgroundColor = '#f8fafc';
        };
        
        tr.onmouseleave = function() {
            this.style.backgroundColor = '';
        };
        
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    // Pied de table
    const tfoot = document.createElement('tfoot');
    tfoot.innerHTML = `
        <tr>
            <td style="padding:8px 10px;"><strong>${totals.city}</strong></td>
            <td style="padding:8px 10px;"><strong>${totals.count}</strong></td>
            <td style="padding:8px 10px;"><strong>${totals.avgSatisfaction.toFixed(2)}</strong></td>
            <td style="padding:8px 10px;"><strong>${totals.avgCGPA.toFixed(2)}</strong></td>
            <td style="padding:8px 10px;"><strong>${(totals.depressionRate * 100).toFixed(1)}%</strong></td>
        </tr>
    `;
    table.appendChild(tfoot);
    
    // Table base styles
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    table.style.color = '#475569';

    container.appendChild(table);
}

// Exposer les fonctions
window.initCityTable = initCityTable;
window.updateCityTable = updateCityTable;