// js/charts/outliers.js


function detectOutliers(data, features, method = 'mahalanobis') {
    if (data.length < 10) return [];
    
    switch(method) {
        case 'mahalanobis':
            return detectWithMahalanobis(data, features);
        case 'isolation':
            return detectWithIsolationForest(data, features);
        case 'zscore':
            return detectWithZScore(data, features);
        default:
            return detectWithMahalanobis(data, features);
    }
}

// Détection avec distance de Mahalanobis
function detectWithMahalanobis(data, features) {
    const vectors = data.map(d => features.map(f => d[f] || 0));
    
    // Calculer la moyenne et la matrice de covariance
    const means = features.map((f, i) => 
        d3.mean(vectors, v => v[i])
    );
    
    const cov = covarianceMatrix(vectors);
    
    // Calculer les distances de Mahalanobis
    const distances = vectors.map(vector => 
        mahalanobisDistance(vector, means, cov)
    );
    
    // Identifier les outliers (distance > 3 écarts-types)
    const meanDist = d3.mean(distances);
    const stdDist = d3.deviation(distances);
    const threshold = meanDist + 3 * stdDist;
    
    return data.map((d, i) => ({
        ...d,
        outlierScore: distances[i],
        isOutlier: distances[i] > threshold,
        reason: getOutlierReason(d, features, vectors[i], means)
    })).filter(d => d.isOutlier)
       .sort((a, b) => b.outlierScore - a.outlierScore)
       .slice(0, 10); // Top 10 outliers
}

// Détection avec forêt d'isolation (simplifiée)
function detectWithIsolationForest(data, features) {
    const vectors = data.map(d => features.map(f => d[f] || 0));
    const nTrees = 100;
    const subSampleSize = Math.min(256, data.length);
    
    const scores = vectors.map(() => 0);
    
    // Simulation simplifiée
    for (let tree = 0; tree < nTrees; tree++) {
        const sampleIndices = d3.shuffle(d3.range(data.length))
            .slice(0, subSampleSize);
        
        sampleIndices.forEach(idx => {
            // Score basé sur la variance des features
            const variance = d3.variance(vectors[idx]);
            scores[idx] += variance;
        });
    }
    
    // Normaliser les scores
    const maxScore = d3.max(scores);
    const normalizedScores = scores.map(s => s / (maxScore || 1));
    
    const threshold = 0.7; // Seuil arbitraire
    
    return data.map((d, i) => ({
        ...d,
        outlierScore: normalizedScores[i],
        isOutlier: normalizedScores[i] > threshold,
        reason: `Score d'isolation élevé: ${(normalizedScores[i] * 100).toFixed(1)}%`
    })).filter(d => d.isOutlier)
       .sort((a, b) => b.outlierScore - a.outlierScore)
       .slice(0, 10);
}

// Détection avec score Z combiné
function detectWithZScore(data, features) {
    const vectors = data.map(d => features.map(f => d[f] || 0));
    
    // Calculer les z-scores pour chaque feature
    const zScores = vectors.map(vector => 
        vector.map((val, i) => {
            const values = vectors.map(v => v[i]);
            const mean = d3.mean(values);
            const std = d3.deviation(values) || 1;
            return Math.abs((val - mean) / std);
        })
    );
    
    // Score combiné (maximum des z-scores absolus)
    const combinedScores = zScores.map(scores => d3.max(scores));
    
    const threshold = 3; // Z-score > 3
    
    return data.map((d, i) => ({
        ...d,
        outlierScore: combinedScores[i],
        isOutlier: combinedScores[i] > threshold,
        reason: getZScoreReason(zScores[i], features)
    })).filter(d => d.isOutlier)
       .sort((a, b) => b.outlierScore - a.outlierScore)
       .slice(0, 10);
}

// Distance de Mahalanobis
function mahalanobisDistance(vector, means, cov) {
    const diff = vector.map((v, i) => v - means[i]);
    
    // Inverser la matrice de covariance (simplifié)
    // En production, utiliser une bibliothèque mathématique
    const invCov = pseudoInverse(cov);
    
    let distance = 0;
    for (let i = 0; i < diff.length; i++) {
        for (let j = 0; j < diff.length; j++) {
            distance += diff[i] * invCov[i][j] * diff[j];
        }
    }
    
    return Math.sqrt(distance);
}

// Matrice de covariance
function covarianceMatrix(vectors) {
    const n = vectors.length;
    const m = vectors[0].length;
    const cov = Array(m).fill().map(() => Array(m).fill(0));
    
    // Moyennes
    const means = Array(m).fill(0);
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            means[j] += vectors[i][j];
        }
    }
    means.forEach((val, i) => means[i] = val / n);
    
    // Covariance
    for (let i = 0; i < m; i++) {
        for (let j = i; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
                sum += (vectors[k][i] - means[i]) * (vectors[k][j] - means[j]);
            }
            cov[i][j] = sum / (n - 1);
            cov[j][i] = cov[i][j];
        }
    }
    
    return cov;
}

// Inverse pseudo (simplifié)
function pseudoInverse(matrix) {
    // Pour une matrice diagonale simple
    const result = matrix.map(row => [...row]);
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[i].length; j++) {
            if (i === j && result[i][j] !== 0) {
                result[i][j] = 1 / result[i][j];
            } else {
                result[i][j] = 0;
            }
        }
    }
    return result;
}

// Raison de l'outlier
function getOutlierReason(student, features, vector, means) {
    const deviations = vector.map((v, i) => Math.abs(v - means[i]));
    const maxDevIndex = deviations.indexOf(d3.max(deviations));
    const maxFeature = features[maxDevIndex];
    const deviation = deviations[maxDevIndex].toFixed(2);
    
    return `Écart important sur ${maxFeature} (déviation: ${deviation})`;
}

function getZScoreReason(zScores, features) {
    const maxIndex = zScores.indexOf(d3.max(zScores));
    const maxFeature = features[maxIndex];
    const maxZ = zScores[maxIndex].toFixed(2);
    
    return `Score Z extrême sur ${maxFeature} (Z = ${maxZ})`;
}

// Afficher les outliers
function displayOutliers(container, outliers) {
    const containerEl = document.querySelector(container);
    
    if (!outliers || outliers.length === 0) {
        containerEl.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <p>Aucun outlier significatif détecté dans ce cluster.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="outliers-grid">';
    
    outliers.forEach((outlier, index) => {
        html += `
            <div class="outlier-card" data-id="${outlier.id}">
                <div class="outlier-header">
                    <span class="outlier-id">Étudiant #${outlier.id}</span>
                    <span class="outlier-score">Score: ${outlier.outlierScore.toFixed(2)}</span>
                </div>
                <div class="outlier-cluster">Cluster ${outlier.cluster_id + 1}</div>
                <div class="outlier-stats">
                    <div>Âge: ${outlier.age}</div>
                    <div>Dépression: ${outlier.depression === 1 ? 'Oui' : 'Non'}</div>
                    <div>CGPA: ${outlier.cgpa?.toFixed(2) || 'N/A'}</div>
                </div>
                <div class="outlier-reason">${outlier.reason}</div>
            </div>
        `;
    });
    
    html += '</div>';
    containerEl.innerHTML = html;
    
    // Événements sur les cartes d'outliers
    document.querySelectorAll('.outlier-card').forEach(card => {
        card.addEventListener('click', function() {
            const studentId = parseInt(this.dataset.id);
            const student = outliers.find(o => o.id === studentId);
            if (student) {
                // Déclencher un événement de sélection
                const event = new CustomEvent('outlierSelected', { detail: student });
                document.dispatchEvent(event);
            }
        });
    });
}