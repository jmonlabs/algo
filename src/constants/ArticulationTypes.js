/**
 * Definitions of available articulation types and their requirements
 */
export const ARTICULATION_TYPES = {
    // Simple articulations
    'staccato': {
        complex: false,
        description: 'Shortens note duration to ~50%'
    },
    'staccatissimo': {
        complex: false,
        description: 'Shortens note duration to ~25%'
    },
    'accent': { 
        complex: false, 
        description: 'Increases note velocity/emphasis' 
    },
    'tenuto': { 
        complex: false, 
        description: 'Holds note for full duration with emphasis' 
    },
    'legato': { 
        complex: false, 
        description: 'Smooth connection between notes' 
    },
    'marcato': { 
        complex: false, 
        description: 'Strong accent with slight separation' 
    },
    
    // Complex articulations
    'glissando': { 
        complex: true, 
        requiredParams: ['target'], 
        description: 'Smooth slide from note to target pitch' 
    },
    'portamento': { 
        complex: true, 
        requiredParams: ['target'], 
        optionalParams: ['curve', 'speed'],
        description: 'Expressive slide between pitches' 
    },
    'bend': { 
        complex: true, 
        requiredParams: ['amount'], 
        optionalParams: ['curve', 'returnToOriginal'],
        description: 'Pitch bend up or down in cents' 
    },
    'vibrato': { 
        complex: true, 
        optionalParams: ['rate', 'depth', 'delay'],
        description: 'Periodic pitch variation' 
    },
    'tremolo': { 
        complex: true, 
        optionalParams: ['rate', 'depth'],
        description: 'Rapid volume variation' 
    },
    'crescendo': { 
        complex: true, 
        requiredParams: ['endVelocity'], 
        optionalParams: ['curve'],
        description: 'Gradual volume increase' 
    },
    'diminuendo': { 
        complex: true, 
        requiredParams: ['endVelocity'], 
        optionalParams: ['curve'],
        description: 'Gradual volume decrease' 
    }
};