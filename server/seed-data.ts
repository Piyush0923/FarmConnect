import { db } from './db';
import { schemes, users, farmers, lands, crops } from '@shared/schema';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Create demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const [demoUser] = await db
      .insert(users)
      .values({
        username: 'farmer1',
        password: hashedPassword,
        role: 'farmer'
      })
      .onConflictDoNothing()
      .returning();

    console.log('👤 Demo user created:', demoUser?.username || 'farmer1');

    // Create demo farmer profile
    if (demoUser) {
      const [demoFarmer] = await db
        .insert(farmers)
        .values({
          userId: demoUser.id,
          name: 'Rajesh Kumar',
          fatherName: 'Ramesh Kumar',
          age: 35,
          gender: 'male',
          mobileNumber: '9876543210',
          aadharNumber: '123456789012',
          state: 'maharashtra',
          district: 'Pune',
          village: 'Rajgurunagar',
          pincode: '410505',
          category: 'general',
          address: 'Village Rajgurunagar, Tehsil Khed, District Pune',
          bankAccountNumber: 'HDFC001234567890',
          ifscCode: 'HDFC0001234',
          language: 'en'
        })
        .onConflictDoNothing()
        .returning();

      console.log('👨‍🌾 Demo farmer profile created:', demoFarmer?.name || 'Rajesh Kumar');

      // Create sample land records
      if (demoFarmer) {
        await db
          .insert(lands)
          .values([
            {
              farmerId: demoFarmer.id,
              surveyNumber: 'SUR001',
              area: '2.5',
              soilType: 'black',
              landType: 'irrigated',
              ownershipType: 'owned'
            },
            {
              farmerId: demoFarmer.id,
              surveyNumber: 'SUR002', 
              area: '1.8',
              soilType: 'red',
              landType: 'rain-fed',
              ownershipType: 'owned'
            }
          ])
          .onConflictDoNothing();

        // Create sample crop records
        const currentYear = new Date().getFullYear();
        await db
          .insert(crops)
          .values([
            {
              farmerId: demoFarmer.id,
              cropName: 'wheat',
              variety: 'HD-2967',
              area: '1.5',
              season: 'rabi',
              year: currentYear,
              sowingDate: new Date(currentYear, 10, 15), // November 15
              expectedHarvest: new Date(currentYear + 1, 3, 20) // April 20
            },
            {
              farmerId: demoFarmer.id,
              cropName: 'cotton',
              variety: 'BT-Cotton',
              area: '2.8',
              season: 'kharif',
              year: currentYear,
              sowingDate: new Date(currentYear, 5, 10), // June 10
              expectedHarvest: new Date(currentYear, 11, 15) // December 15
            }
          ])
          .onConflictDoNothing();

        console.log('🌾 Sample land and crop data created');
      }
    }

    // Sample government schemes data
    const sampleSchemes = [
      {
        name: 'PM-KISAN Scheme',
        description: 'Direct income support to farmers providing ₹6,000 per year in three equal instalments.',
        benefits: 'Financial assistance of ₹6,000 per year for small and marginal farmers',
        eligibilityCriteria: JSON.stringify([
          'Small and marginal farmers',
          'Land holding up to 2 hectares',
          'Valid Aadhar card required'
        ]),
        requiredDocuments: JSON.stringify([
          'Aadhar card',
          'Bank account details',
          'Land ownership documents'
        ]),
        applicationProcess: 'Apply online at pmkisan.gov.in or visit nearest Common Service Center',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        schemeType: 'central',
        department: 'Ministry of Agriculture & Farmers Welfare',
        benefitAmount: '6000',
        isActive: true,
        targetStates: JSON.stringify(['maharashtra', 'punjab', 'haryana', 'uttar-pradesh', 'gujarat']),
        targetCrops: JSON.stringify(['rice', 'wheat', 'sugarcane', 'cotton']),
        landSizeMin: '0.1',
        landSizeMax: '2.0',
        ageMin: 18,
        ageMax: 70,
        applicableCategories: JSON.stringify(['general', 'obc', 'sc', 'st'])
      },
      {
        name: 'Pradhan Mantri Fasal Bima Yojana',
        description: 'Crop insurance scheme providing financial support to farmers suffering crop loss/damage.',
        benefits: 'Insurance coverage for crop losses due to natural calamities, pests & diseases',
        eligibilityCriteria: JSON.stringify([
          'All farmers growing notified crops',
          'Sharecroppers and tenant farmers eligible',
          'Premium rates: 2% for Kharif, 1.5% for Rabi crops'
        ]),
        requiredDocuments: JSON.stringify([
          'Aadhar card',
          'Bank account details',
          'Land records',
          'Sowing certificate'
        ]),
        applicationProcess: 'Apply through banks, insurance companies or online portal',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        schemeType: 'central',
        department: 'Ministry of Agriculture & Farmers Welfare',
        benefitAmount: '200000',
        isActive: true,
        targetStates: JSON.stringify(['maharashtra', 'punjab', 'haryana', 'uttar-pradesh']),
        targetCrops: JSON.stringify(['rice', 'wheat', 'sugarcane', 'cotton', 'soybean']),
        landSizeMin: '0.1',
        landSizeMax: '50.0',
        ageMin: 18,
        ageMax: 75,
        applicableCategories: JSON.stringify(['general', 'obc', 'sc', 'st'])
      },
      {
        name: 'Soil Health Card Scheme',
        description: 'Provides soil health cards to farmers with recommendations for appropriate nutrients and fertilizers.',
        benefits: 'Free soil testing and customized fertilizer recommendations to improve soil health',
        eligibilityCriteria: JSON.stringify([
          'All farmers',
          'Individual and institutional land holders',
          'One card per 2.5 acres'
        ]),
        requiredDocuments: JSON.stringify([
          'Land ownership documents',
          'Aadhar card',
          'Village revenue records'
        ]),
        applicationProcess: 'Contact local agriculture department or visit designated soil testing centers',
        schemeType: 'central',
        department: 'Ministry of Agriculture & Farmers Welfare',
        isActive: true,
        targetStates: JSON.stringify(['maharashtra', 'punjab', 'haryana', 'uttar-pradesh', 'gujarat']),
        targetCrops: JSON.stringify(['rice', 'wheat', 'sugarcane', 'cotton', 'soybean']),
        landSizeMin: '0.1',
        landSizeMax: '100.0',
        ageMin: 18,
        ageMax: 80,
        applicableCategories: JSON.stringify(['general', 'obc', 'sc', 'st'])
      },
      {
        name: 'Maharashtra State Agriculture Loan Waiver',
        description: 'State government scheme for waiving agricultural loans for small and marginal farmers.',
        benefits: 'Complete waiver of outstanding agricultural loans up to ₹1.5 lakh',
        eligibilityCriteria: JSON.stringify([
          'Small and marginal farmers in Maharashtra',
          'Land holding up to 5 acres',
          'Outstanding loan up to ₹1.5 lakh'
        ]),
        requiredDocuments: JSON.stringify([
          'Loan documents',
          'Land records',
          'Aadhar card',
          '7/12 extract'
        ]),
        applicationProcess: 'Apply through designated banks and cooperative societies',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        schemeType: 'state',
        department: 'Maharashtra Agriculture Department',
        benefitAmount: '150000',
        isActive: true,
        targetStates: JSON.stringify(['maharashtra']),
        targetCrops: JSON.stringify(['rice', 'sugarcane', 'cotton', 'soybean']),
        landSizeMin: '0.1',
        landSizeMax: '5.0',
        ageMin: 18,
        ageMax: 70,
        applicableCategories: JSON.stringify(['general', 'obc', 'sc', 'st'])
      },
      {
        name: 'Punjab Crop Diversification Scheme',
        description: 'Incentive scheme to promote crop diversification from rice to alternative crops.',
        benefits: 'Financial incentive of ₹17,500 per hectare for shifting from rice to alternative crops',
        eligibilityCriteria: JSON.stringify([
          'Farmers in Punjab',
          'Must shift from rice cultivation',
          'Alternative crops: maize, cotton, sugarcane, basmati rice'
        ]),
        requiredDocuments: JSON.stringify([
          'Land records',
          'Previous year crop details',
          'Aadhar card',
          'Bank account details'
        ]),
        applicationProcess: 'Apply through Punjab Agriculture Department offices',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        schemeType: 'state',
        department: 'Punjab Agriculture Department',
        benefitAmount: '17500',
        isActive: true,
        targetStates: JSON.stringify(['punjab']),
        targetCrops: JSON.stringify(['maize', 'cotton', 'sugarcane']),
        landSizeMin: '0.5',
        landSizeMax: '20.0',
        ageMin: 18,
        ageMax: 65,
        applicableCategories: JSON.stringify(['general', 'obc', 'sc', 'st'])
      }
    ];

    // Insert schemes
    for (const scheme of sampleSchemes) {
      await db
        .insert(schemes)
        .values(scheme)
        .onConflictDoNothing();
    }

    console.log('🎯 Sample schemes data inserted');
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}