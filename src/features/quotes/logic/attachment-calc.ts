export const calculateAttachmentAmount = (attachments: any[], parentUnitPrice: number) => {
    return attachments.reduce((sum, att) => {
        const price = att.inheritParentPrice ? parentUnitPrice : (att.unitPrice || 0);
        return sum + (price * (att.quantity || 0));
    }, 0);
};

export const generateWallpaperAttachmentRecommendations = (areaSqm: number, gluePrice: number = 0, primerPrice: number = 0) => {
    return [
        { type: 'GLUE', quantity: Math.ceil(areaSqm / 10), unitPrice: gluePrice, inheritParentPrice: false },
        { type: 'PRIMER', quantity: Math.ceil(areaSqm / 15), unitPrice: primerPrice, inheritParentPrice: false }
    ];
};

export const calculateAttachments = () => {
    return [];
};
