/**
 * Definitions of available ornament types and their validation requirements
 */
export const ORNAMENT_TYPES = {
    'grace_note': {
        requiredParams: ['graceNoteType'],
        optionalParams: ['gracePitches'],
        conflicts: [],
        description: 'Single note before the main note',
        defaultParams: {
            graceNoteType: 'acciaccatura'
        },
        validate: (note, params) => {
            if (!['acciaccatura', 'appoggiatura'].includes(params.graceNoteType)) {
                return { valid: false, error: 'graceNoteType must be either acciaccatura or appoggiatura' };
            }
            if (params.gracePitches && !Array.isArray(params.gracePitches)) {
                return { valid: false, error: 'gracePitches must be an array of pitches' };
            }
            return { valid: true };
        }
    },
    'trill': {
        requiredParams: [],
        optionalParams: ['by', 'trillRate'],
        conflicts: ['mordent'],
        minDuration: '8n',
        description: 'Rapid alternation between main note and auxiliary note',
        defaultParams: {
            by: 1.0,
            trillRate: 0.125
        },
        validate: (note, params) => {
            if (params.by && typeof params.by !== 'number') {
                return { valid: false, error: 'trill step (by) must be a number' };
            }
            if (params.trillRate && typeof params.trillRate !== 'number') {
                return { valid: false, error: 'trillRate must be a number' };
            }
            return { valid: true };
        }
    },
    'mordent': {
        requiredParams: [],
        optionalParams: ['by'],
        conflicts: ['trill'],
        description: 'Quick alternation with note above or below',
        defaultParams: {
            by: 1.0
        },
        validate: (note, params) => {
            if (params.by && typeof params.by !== 'number') {
                return { valid: false, error: 'mordent step (by) must be a number' };
            }
            return { valid: true };
        }
    },
    'turn': {
        requiredParams: [],
        optionalParams: ['scale'],
        conflicts: [],
        description: 'Melodic turn around the main note',
        validate: (note, params) => {
            if (params.scale && typeof params.scale !== 'string') {
                return { valid: false, error: 'scale must be a string' };
            }
            return { valid: true };
        }
    },
    'arpeggio': {
        requiredParams: ['arpeggioDegrees'],
        optionalParams: ['direction'],
        conflicts: [],
        description: 'Notes played in sequence',
        defaultParams: {
            direction: 'up'
        },
        validate: (note, params) => {
            if (!Array.isArray(params.arpeggioDegrees)) {
                return { valid: false, error: 'arpeggioDegrees must be an array' };
            }
            if (params.direction && !['up', 'down', 'both'].includes(params.direction)) {
                return { valid: false, error: 'direction must be up, down, or both' };
            }
            return { valid: true };
        }
    }
};