function createDeck() {
    const suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck = [];
    let id = 1;
    for (let suit of suits) {
        for (let j = 0; j < values.length; j++) {
            let value = values[j];
            let point = 0;
            if (value === 'A') point = 1;
            else if (['10', 'J', 'Q', 'K'].includes(value)) point = 0;
            else point = parseInt(value);
            
            deck.push({ id, suit, value, point, rankIndex: j });
            id++;
        }
    }
    
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function evaluateHand(cards) {
    if (!cards || cards.length < 2 || cards.length > 3) return null;
    
    let sum = cards.reduce((acc, c) => acc + c.point, 0) % 10;
    let isSameSuit = cards.every(c => c.suit === cards[0].suit);
    let ranks = cards.map(c => c.rankIndex).sort((a,b) => a - b);
    
    // Check 2 cards
    if (cards.length === 2) {
        let isPair = cards[0].value === cards[1].value;
        let isPok = sum === 8 || sum === 9;
        
        let type = isPok ? (sum === 9 ? 'Pok 9' : 'Pok 8') : 'Normal';
        let multiplier = 1;
        if (isSameSuit) multiplier = 2;       // 2 Deng (Flush)
        else if (isPair) multiplier = 2;      // 2 Deng (Pair)
        
        return {
            type,       // 'Pok 9', 'Pok 8', 'Normal'
            points: sum,
            multiplier, // 1, 2
            rank: isPok ? (sum === 9 ? 600 : 500) : sum // rank for sorting higher is better
        };
    }
    
    // Check 3 cards
    let isTong = ranks[0] === ranks[1] && ranks[1] === ranks[2];
    
    let isStraight = false;
    if (ranks[2] - ranks[1] === 1 && ranks[1] - ranks[0] === 1) isStraight = true;
    if (ranks[0] === 0 && ranks[1] === 11 && ranks[2] === 12) isStraight = true; // Q,K,A
    
    let type = 'Normal';
    let multiplier = 1;
    let rank = sum; 
    
    if (isTong) {
        type = 'Tong';
        multiplier = 3;
        rank = 900;
    } else if (isStraight) {
        type = 'Straight';
        multiplier = 3;
        rank = 800; // lower than Tong, higher than Flush
    } else if (isSameSuit) {
        type = 'Flush 3';
        multiplier = 3; // Flush 3 cards = 3 deng
        rank = 700; 
    } else {
        type = 'Normal';
        multiplier = 1;
        rank = sum;
    }
    
    return {
        type,       
        points: sum,
        multiplier, 
        rank        
    };
}

module.exports = {
    createDeck,
    evaluateHand
};
