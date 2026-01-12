(function () {
    function attach({ container, content, position = 'bottom-left', topOffset, rightOffset, bottomOffset, leftOffset }) {
        const root = d3.select(container);
        if (root.empty()) return;

        // Empêche les doublons
        if (!root.select('.comment-button').empty()) return;

        // Container relatif
        root.style('position', 'relative').style('width', '100%');

        const button = root.append('button')
            .attr('class', 'comment-button')
            .style('position', 'absolute')
            .style('z-index', '30')
            .style('background', '#0b1220')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '50%')
            .style('width', '34px')
            .style('height', '34px')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .style('padding', '0')
            .style('cursor', 'pointer')
            .style('font-size', '14px')
            .style('box-shadow', '0 2px 6px rgba(0,0,0,0.18)')
            .attr('title', 'Description')
            .html('<i class="fas fa-comment-dots" aria-hidden="true"></i>');

        // Décalage vertical positif pour garder le bouton à l'intérieur des cartes
        const verticalOffset = 14; // px: increases bottom offset so button sits inside the card

        // Position par défaut : bas gauche
        switch(position) {
            case 'top-right':
                button.style('top', ((topOffset !== undefined ? topOffset : 8) + verticalOffset) + 'px')
                      .style('right', (rightOffset !== undefined ? rightOffset : 8) + 'px');
                break;
            case 'top-left':
                button.style('top', ((topOffset !== undefined ? topOffset : 8) + verticalOffset) + 'px')
                      .style('left', (leftOffset !== undefined ? leftOffset : 8) + 'px');
                break;
            case 'bottom-right':
                button.style('bottom', ((bottomOffset !== undefined ? bottomOffset : 8) + verticalOffset) + 'px')
                      .style('right', (rightOffset !== undefined ? rightOffset : 8) + 'px');
                break;
            default: // 'bottom-left'
                button.style('bottom', ((bottomOffset !== undefined ? bottomOffset : 8) + verticalOffset) + 'px')
                      .style('left', (leftOffset !== undefined ? leftOffset : 8) + 'px');
        }

        const box = root.append('div')
            .attr('class', 'comment-box')
            .style('position', 'absolute')
            .style('z-index', '20')
            .style('background', 'white')
            .style('border', '1px solid #cbd5e1')
            .style('border-radius', '6px')
            .style('padding', '10px')
            .style('width', '260px')
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
            .style('font-size', '12px')
            .style('display', 'none')
            .html(content);

        // Position de la box juste sous le bouton avec ajustement du décalage
        if(position.startsWith('top')) {
            box.style('top', ((topOffset !== undefined ? topOffset : 8) + verticalOffset + 28) + 'px')
               .style('left', button.style('left') || 'auto')
               .style('right', button.style('right') || 'auto');
        } else { // bottom
            box.style('bottom', ((bottomOffset !== undefined ? bottomOffset : 8) + verticalOffset + 28) + 'px')
               .style('left', button.style('left') || 'auto')
               .style('right', button.style('right') || 'auto');
        }

        button.on('click', () => {
            box.style('display', box.style('display') === 'none' ? 'block' : 'none');
        });
    }

    window.CommentButton = { attach };
})();