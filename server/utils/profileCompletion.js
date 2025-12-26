export const calculateProfileCompletion = (user) => {
    let percent = 0;
    let missingFields = [];

    if (user.accountType === 'job_seeker') {
        const info = user.personalInfo || {};

        // Core fields (60%)
        if (info.fullName) percent += 15; else missingFields.push('fullName');
        if (info.emailAddress || user.email) percent += 10; else missingFields.push('emailAddress'); // Fallback to user.email
        if (info.phoneNumber) percent += 10; else missingFields.push('phoneNumber');
        if (info.bio) percent += 5; else missingFields.push('bio');
        if (info.profilePhotoUrl) percent += 10; else missingFields.push('profilePhotoUrl');
        if (info.resumeUrl) percent += 10; else missingFields.push('resumeUrl');

        // Rich fields (40%)
        if (info.skills && info.skills.length > 0) percent += 15; else missingFields.push('skills');

        // Social Links (10%)
        const social = info.socialLinks || {};
        const hasSocial = social.linkedin || social.github || social.portfolio || social.website;
        if (hasSocial) percent += 10; else missingFields.push('socialLinks');

        // Education (10%)
        const education = info.education || [];
        if (education.length > 0) percent += 10; else missingFields.push('education');

        // Experience (5%)
        const experience = info.experience || [];
        if (experience.length > 0) percent += 5; else missingFields.push('experience');

    } else if (user.accountType === 'organization') {
        const info = user.companyInfo || {};

        if (info.companyName) percent += 20; else missingFields.push('companyName');
        if (info.industry) percent += 15; else missingFields.push('industry');
        if (info.address) percent += 15; else missingFields.push('address');
        if (info.logoUrl) percent += 15; else missingFields.push('logoUrl');

        // Extended fields
        if (info.description) percent += 10; else missingFields.push('description');
        if (info.website) percent += 10; else missingFields.push('website');
        if (info.contactEmail) percent += 15; else missingFields.push('contactEmail');
    }

    // Cap at 100
    if (percent > 100) percent = 100;

    return { percent, missingFields };
};
