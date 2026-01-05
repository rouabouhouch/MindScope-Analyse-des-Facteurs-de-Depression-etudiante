// js/main.js


let studentData = [];

// Charger les données CSV
 async function loadData() {
    try {
        const data = await d3.csv('data/student_depression_dataset.csv');
        
        // Prétraiter les données
        studentData = preprocessStudentData(data);
        
        console.log(`Données chargées: ${studentData.length} étudiants`);
        return studentData;
        
    } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        throw error;
    }
}

// Prétraiter les données
 
function preprocessStudentData(rawData) {
    console.log('Prétraitement de', rawData.length, 'lignes');
    
    if (!rawData || rawData.length === 0) {
        console.warn('Aucune donnée à prétraiter');
        return [];
    }
    
    // Vérifier la première ligne
    const firstRow = rawData[0];
    console.log('Première ligne brute:', firstRow);
    console.log('Clés de la première ligne:', Object.keys(firstRow));
    
    // Vérifier les valeurs spécifiques
    console.log('Valeur de Depression dans rawData[0]:', firstRow.Depression, 'type:', typeof firstRow.Depression);
    console.log('Valeur de Age dans rawData[0]:', firstRow.Age, 'type:', typeof firstRow.Age);
    console.log('Valeur de Academic Pressure dans rawData[0]:', firstRow['Academic Pressure'], 'type:', typeof firstRow['Academic Pressure']);
    
    const processed = rawData.map((row, index) => {
        try {
            // Fonction helper pour parser les nombres
            const parseNumber = (value, defaultValue = 0) => {
                if (value === undefined || value === null || value === '') {
                    return defaultValue;
                }
                
                // Essayer de convertir en nombre
                const num = Number(value);
                
                // Vérifier si c'est un nombre valide
                if (isNaN(num)) {
                    // Essayer de parser comme float
                    const parsed = parseFloat(value);
                    return isNaN(parsed) ? defaultValue : parsed;
                }
                
                return num;
            };
            
            // Fonction pour parser les valeurs de dépression
            const parseDepression = (value) => {
                if (value === undefined || value === null) return 0;
                
                // Essayer comme nombre
                const num = Number(value);
                if (!isNaN(num)) return num;
                
                // Essayer comme booléen/chaîne
                if (value === 'Yes' || value === 'yes' || value === 'TRUE' || value === 'true') return 1;
                if (value === 'No' || value === 'no' || value === 'FALSE' || value === 'false') return 0;
                
                return 0;
            };
            
            // Traiter chaque champ avec soin
            const processedRow = {
                id: parseNumber(row.id, index + 1),
                gender: (row.Gender || row.gender || 'Unknown').toString().trim(),
                age: parseNumber(row.Age || row.age, 20),
                city: (row.City || row.city || 'Unknown').toString().trim(),
                profession: (row.Profession || row.profession || 'Student').toString().trim(),
                academic_pressure: parseNumber(row['Academic Pressure'] || row.academic_pressure, 3),
                work_pressure: parseNumber(row['Work Pressure'] || row.work_pressure, 0),
                cgpa: parseNumber(row.CGPA || row.cgpa, 5),
                study_satisfaction: parseNumber(row['Study Satisfaction'] || row.study_satisfaction, 3),
                job_satisfaction: parseNumber(row['Job Satisfaction'] || row.job_satisfaction, 0),
                sleep_duration: Utils.mapScore(row['Sleep Duration'] || row.sleep_duration),
                dietary_habits: Utils.mapScore(row['Dietary Habits'] || row.dietary_habits),
                degree: (row.Degree || row.degree || 'Unknown').toString().trim(),
                hasSuicidalThoughts: (row['Have you ever had suicidal thoughts ?'] || '').toString().trim().toLowerCase() === 'yes',
                work_study_hours: parseNumber(row['Work/Study Hours'] || row.work_study_hours, 8),
                financial_stress: parseNumber(row['Financial Stress'] || row.financial_stress, 3),
                family_history: (row['Family History of Mental Illness'] || '').toString().trim().toLowerCase() === 'yes',
                depression: parseDepression(row.Depression || row.depression)
            };
            
            // Normaliser les valeurs
            processedRow.sleep_duration = Math.max(1, Math.min(5, processedRow.sleep_duration));
            processedRow.dietary_habits = Math.max(1, Math.min(5, processedRow.dietary_habits));
            processedRow.cgpa = Math.max(0, Math.min(10, processedRow.cgpa));
            
            // Calculer le score de bien-être
            processedRow.wellness_score = calculateWellnessScore(processedRow);
            
            return processedRow;
            
        } catch (error) {
            console.error(`Erreur lors du traitement de la ligne ${index}:`, error);
            console.error('Ligne problématique:', row);
            
            // Retourner un objet par défaut
            return {
                
            };
        }
    });
    
    console.log('Prétraitement terminé. Données valides:', processed.length);
    
    // Analyser les statistiques de dépression
    const depressionStats = {
        total: processed.length,
        depressed: processed.filter(d => d.depression === 1).length,
        depressedAny: processed.filter(d => d.depression > 0).length
    };
    
    console.log('Statistiques de dépression:', depressionStats);
    console.log(`Taux de dépression: ${(depressionStats.depressed / depressionStats.total * 100).toFixed(1)}%`);
    
    return processed;
}


// Calculer un score de bien-être
function calculateWellnessScore(student) {
    const factors = {
        sleep: student.sleep_duration / 5,
        diet: student.dietary_habits / 5,
        satisfaction: student.study_satisfaction / 5,
        financial: 1 - (student.financial_stress / 5),
        academic: 1 - (student.academic_pressure / 5)
    };
    
    const weights = {
        sleep: 0.25,
        diet: 0.15,
        satisfaction: 0.2,
        financial: 0.2,
        academic: 0.2
    };
    
    let score = 0;
    for (const [factor, value] of Object.entries(factors)) {
        score += value * weights[factor];
    }
    
    return Math.min(100, score * 100);
}

// Configurer les filtres
 function setupFilters(onFilterChange) {
    const filterState = {
        gender: 'all',
        degree: 'all',
        depression: 'all',
        ageRange: [18, 40],
        cgpaRange: [0, 10]
    };
    
    // Initialiser les événements de filtre
    document.getElementById('genderFilter').addEventListener('change', (e) => {
        filterState.gender = e.target.value;
        applyFilters();
    });
    
    document.getElementById('degreeFilter').addEventListener('change', (e) => {
        filterState.degree = e.target.value;
        applyFilters();
    });
    
    document.getElementById('depressionFilter').addEventListener('change', (e) => {
        filterState.depression = e.target.value;
        applyFilters();
    });
    
    // Appliquer les filtres
    function applyFilters() {
        let filtered = [...studentData];
        
        // Filtre genre
        if (filterState.gender !== 'all') {
            filtered = filtered.filter(d => d.gender === filterState.gender);
        }
        
        // Filtre niveau d'étude
        if (filterState.degree !== 'all') {
            filtered = filtered.filter(d => {
                const degree = d.degree.toLowerCase();
                if (filterState.degree === 'Bachelor') return degree.includes('bachelor');
                if (filterState.degree === 'Master') return degree.includes('master');
                if (filterState.degree === 'PhD') return degree.includes('doctor') || degree.includes('phd');
                return true;
            });
        }
        
        // Filtre dépression
        if (filterState.depression !== 'all') {
            filtered = filtered.filter(d => 
                filterState.depression === 'depressed' ? 
                d.depression === 1 : d.depression === 0
            );
        }
        
        // Appeler le callback avec les données filtrées
        if (onFilterChange) {
            onFilterChange(filtered);
        }
        
        return filtered;
    }
    
    // Interface publique
    return {
        getFilteredData: applyFilters,
        updateFilter: (key, value) => {
            filterState[key] = value;
            return applyFilters();
        },
        resetFilters: () => {
            filterState.gender = 'all';
            filterState.degree = 'all';
            filterState.depression = 'all';
            document.getElementById('genderFilter').value = 'all';
            document.getElementById('degreeFilter').value = 'all';
            document.getElementById('depressionFilter').value = 'all';
            return applyFilters();
        }
    };
}

// Obtenir les données
 function getStudentData() {
    return studentData;
}

// Obtenir les statistiques de base

function getBasicStats() {
    const total = studentData.length;
    const depressed = studentData.filter(d => d.depression === 1).length;
    const suicidal = studentData.filter(d => d.hasSuicidalThoughts).length;
    
    return {
        total,
        depressed,
        suicidal,
        depressionRate: (depressed / total) * 100,
        suicidalRate: (suicidal / total) * 100,
        avgAge: d3.mean(studentData, d => d.age),
        avgCGPA: d3.mean(studentData, d => d.cgpa)
    };
}