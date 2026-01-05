

// K-means clustering
 function performClustering(data, k = 5, maxIterations = 100) {
    if (data.length === 0) return [];
    
    // Standardiser les données
    const features = extractFeatures(data);
    const standardized = standardizeData(features);
    
    // Initialiser les centroïdes aléatoirement
    let centroids = initializeCentroids(standardized, k);
    let clusters = new Array(data.length).fill(0);
    let changed = true;
    let iterations = 0;
    
    // Algorithme K-means
    while (changed && iterations < maxIterations) {
        changed = false;
        
        // Assigner chaque point au centroid le plus proche
        for (let i = 0; i < standardized.length; i++) {
            const distances = centroids.map(centroid => 
                euclideanDistance(standardized[i], centroid)
            );
            const newCluster = distances.indexOf(Math.min(...distances));
            
            if (newCluster !== clusters[i]) {
                clusters[i] = newCluster;
                changed = true;
            }
        }
        
        // Mettre à jour les centroïdes
        centroids = updateCentroids(standardized, clusters, k);
        iterations++;
    }
    
    // Ajouter les labels de cluster aux données originales
    data.forEach((d, i) => {
        d.cluster_id = clusters[i];
    });
    
    // Regrouper par cluster
    const groupedClusters = Array(k).fill().map(() => []);
    data.forEach((d, i) => {
        groupedClusters[clusters[i]].push(d);
    });
    
    return groupedClusters;
}

// Extraire les features pour le clustering
function extractFeatures(data) {
    return data.map(d => [
        d.academic_pressure || 0,
        d.study_satisfaction || 0,
        d.sleep_duration || 0,
        d.financial_stress || 0,
        d.dietary_habits || 0,
        d.work_study_hours || 0,
        d.cgpa || 0
    ]);
}

// Standardiser les données (z-score)
function standardizeData(data) {
    const means = [];
    const stds = [];
    const n = data[0].length;
    
    // Calculer les moyennes
    for (let i = 0; i < n; i++) {
        const values = data.map(row => row[i]);
        means.push(d3.mean(values));
        stds.push(d3.deviation(values) || 1);
    }
    
    // Appliquer la standardisation
    return data.map(row => 
        row.map((val, i) => (val - means[i]) / stds[i])
    );
}

// Initialiser les centroïdes aléatoirement
function initializeCentroids(data, k) {
    const centroids = [];
    const indices = new Set();
    
    while (centroids.length < k) {
        const idx = Math.floor(Math.random() * data.length);
        if (!indices.has(idx)) {
            indices.add(idx);
            centroids.push([...data[idx]]);
        }
    }
    
    return centroids;
}

// Distance euclidienne
function euclideanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
}

// Mettre à jour les centroïdes
function updateCentroids(data, clusters, k) {
    const newCentroids = Array(k).fill().map(() => 
        Array(data[0].length).fill(0)
    );
    const counts = Array(k).fill(0);
    
    // Somme des points par cluster
    for (let i = 0; i < data.length; i++) {
        const cluster = clusters[i];
        counts[cluster]++;
        for (let j = 0; j < data[i].length; j++) {
            newCentroids[cluster][j] += data[i][j];
        }
    }
    
    // Moyenne
    for (let i = 0; i < k; i++) {
        if (counts[i] > 0) {
            for (let j = 0; j < newCentroids[i].length; j++) {
                newCentroids[i][j] /= counts[i];
            }
        }
    }
    
    return newCentroids;
}

// Réduction de dimension PCA (simplifiée)
function performPCA(data, dimensions = 2) {
    const features = extractFeatures(data);
    const standardized = standardizeData(features);
    
    // Calculer la matrice de covariance
    const cov = covarianceMatrix(standardized);
    
    // Calculer les valeurs/vecteurs propres (simplifié)
    // En production, utiliser une bibliothèque comme ml-pca
    
    // Pour la démo, retourner des coordonnées aléatoires mais structurées
    const result = [];
    for (let i = 0; i < standardized.length; i++) {
        // Simuler PCA avec une combinaison linéaire
        const x = standardized[i][0] * 0.3 + standardized[i][1] * 0.2 + standardized[i][2] * 0.1;
        const y = standardized[i][3] * 0.2 + standardized[i][4] * 0.1 + standardized[i][5] * 0.3;
        result.push([x, y]);
    }
    
    return result;
}

// Matrice de covariance
function covarianceMatrix(data) {
    const n = data.length;
    const m = data[0].length;
    const cov = Array(m).fill().map(() => Array(m).fill(0));
    
    // Calculer les moyennes
    const means = Array(m).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            means[j] += data[i][j];
        }
    }
    means.forEach((val, i) => means[i] = val / n);
    
    // Calculer la covariance
    for (let i = 0; i < m; i++) {
        for (let j = i; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += (data[k][i] - means[i]) * (data[k][j] - means[j]);
            }
            cov[i][j] = sum / (n - 1);
            cov[j][i] = cov[i][j];
        }
    }
    
    return cov;
}