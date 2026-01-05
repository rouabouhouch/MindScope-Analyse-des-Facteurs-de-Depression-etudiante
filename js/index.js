import { loadData, setupFilters } from './main.js';
import { createClusterPlot } from './charts/dimReduction.js';
import { createRadarChart as createSummaryRadar } from './charts/studentRadar.js';

async function init() {
    try {
        await loadData();
        
        const filterManager = setupFilters(renderOverviewPage);
        renderOverviewPage(filterManager.getFilteredData());
        
    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        d3.select("#kpi-container").html("<p style='color:red'>Erreur de chargement du fichier CSV. Vérifiez le chemin 'data/student_depression_dataset.csv'</p>");
    }
}

function renderOverviewPage(data) {
    const total = data.length;
    const depressedCount = data.filter(d => d.isDepressed).length;
    const suicidalCount = data.filter(d => d.hasSuicidalThoughts).length;
    const avgPressure = d3.mean(data, d => d.academic_pressure).toFixed(1);
    const lowSleepCount = data.filter(d => d.sleep_duration <= 2).length;

    const kpiContainer = d3.select("#kpi-container");
    kpiContainer.html(`
        <div class="kpi-card">
            <div class="kpi-label">Prévalence Dépression</div>
            <div class="kpi-value" style="color:#ef4444">${((depressedCount/total)*100).toFixed(1)}%</div>
            <div class="kpi-subtext">${depressedCount} étudiants</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Alerte Idées Suicidaires</div>
            <div class="kpi-value" style="color:#b91c1c">${((suicidalCount/total)*100).toFixed(1)}%</div>
            <div class="kpi-subtext">Niveau de risque élevé</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Pression Académique Moyenne</div>
            <div class="kpi-value">${avgPressure} <small>/5</small></div>
            <div class="kpi-subtext">Moyenne de la cohorte</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Sommeil Insuffisant</div>
            <div class="kpi-value">${((lowSleepCount/total)*100).toFixed(1)}%</div>
            <div class="kpi-subtext">Dort moins de 6h</div>
        </div>
    `);

    createClusterPlot(data, "#cluster-chart", (student) => {
        updateSummaryRadar(student, data);
    });
    
    if (data.length > 0) {
        updateSummaryRadar(data[0], data);
    }
}

function updateSummaryRadar(student, allData) {
    const averages = {
        'Pression': d3.mean(allData, d => d.academic_pressure),
        'Satisfaction': d3.mean(allData, d => d.study_satisfaction),
        'Sommeil': d3.mean(allData, d => d.sleep_duration),
        'Finance': d3.mean(allData, d => d.financial_stress)
    };

    const target = {
        'Pression': student.academic_pressure,
        'Satisfaction': student.study_satisfaction,
        'Sommeil': student.sleep_duration,
        'Finance': student.financial_stress
    };
    
    createSummaryRadar(target, averages, "#radar-chart");
}

init();