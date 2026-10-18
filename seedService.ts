import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import { ItemReport } from '../types';
import { extractKeywords } from './itemService';

export const SAMPLE_CAMPUS_ITEMS: Array<Omit<ItemReport, 'id' | 'createdAt' | 'updatedAt' | 'normalizedName' | 'keywords'>> = [
  {
    ownerId: 'campus_security_office',
    ownerName: 'Campus Security & Desk',
    ownerEmail: 'security@campus.edu',
    reportType: 'found',
    itemName: 'Apple MacBook Air 13" Space Gray',
    category: 'Electronics',
    description: 'Found on table 14 near the silent study pods on the 2nd floor of Central Library. Space Gray finish, stickers on upper shell include "GitHub Octocat" and "IEEE Student Member". Kept locked in the campus safety vault.',
    location: 'Central Library — 2nd Floor Quiet Study',
    eventDate: '2026-10-02',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Space Gray with GitHub and IEEE stickers on outer lid, purple keyboard cover.',
    contactPreference: 'in_app',
    status: 'Active',
  },
  {
    ownerId: 'student_sarah_90',
    ownerName: 'Sarah Jenkins',
    ownerEmail: 'sarah.j@campus.edu',
    reportType: 'lost',
    itemName: 'Hydro Flask 32oz Cobalt Blue Bottle',
    category: 'Water Bottles',
    description: 'Left on the bench in the Main Gymnasium court B during Tuesday basketball intramurals. Has a dent near the bottom rim and yellow silicon boot.',
    location: 'Campus Recreation Center & Gymnasium',
    eventDate: '2026-10-01',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Cobalt blue, yellow boot, dent at lower base.',
    contactPreference: 'email',
    status: 'Active',
  },
  {
    ownerId: 'student_marcus_k',
    ownerName: 'Marcus Ramirez',
    ownerEmail: 'marcus.r@campus.edu',
    reportType: 'lost',
    itemName: 'Campus Student ID Card & Key Fob',
    category: 'ID Cards',
    description: 'Lost somewhere between the Dining Commons and Science Complex Hall A. Student ID has my name "Marcus Ramirez" (ID# 893412) with a green campus lanyard and dorm key fob.',
    location: 'Science Complex Pathway / Dining Commons',
    eventDate: '2026-10-03',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Name on card Marcus Ramirez, neon green lanyard with Dorm #304 fob.',
    contactPreference: 'in_app',
    status: 'Active',
  },
  {
    ownerId: 'campus_lab_assistant',
    ownerName: 'David Chen (TA)',
    ownerEmail: 'david.chen@campus.edu',
    reportType: 'found',
    itemName: 'Casio fx-991EX Scientific Calculator',
    category: 'Books and Stationery',
    description: 'Found under desk row 3 in Engineering Hall Room 204 after Calculus II lecture. White plastic back with black slide-on case.',
    location: 'Engineering Hall — Room 204',
    eventDate: '2026-10-02',
    imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Initials "A.M." lightly engraved on the back casing.',
    contactPreference: 'in_app',
    status: 'Active',
  },
  {
    ownerId: 'student_elena_p',
    ownerName: 'Elena Patel',
    ownerEmail: 'elena.p@campus.edu',
    reportType: 'found',
    itemName: 'Sony WH-1000XM4 Noise Canceling Headphones',
    category: 'Electronics',
    description: 'Turned in to Student Union Information Desk. Black over-ear headphones in original gray zipper travel case.',
    location: 'Student Union Lounge — 1st Floor',
    eventDate: '2026-09-30',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Black with bronze Sony lettering, custom airplane adapter in case pocket.',
    contactPreference: 'in_app',
    status: 'Active',
  },
  {
    ownerId: 'campus_security_office',
    ownerName: 'Campus Security & Desk',
    ownerEmail: 'security@campus.edu',
    reportType: 'found',
    itemName: 'Set of 4 Keys with Red Subaru Car Fob',
    category: 'Keys',
    description: 'Found on grass near North Parking Lot B near charging stations. Attached to a silver carabiner and red coiled wristband.',
    location: 'North Campus Parking Lot B',
    eventDate: '2026-10-01',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Subaru 3-button fob, 2 brass house keys, 1 small mailbox key.',
    contactPreference: 'in_app',
    status: 'Active',
  },
  {
    ownerId: 'student_jordan_w',
    ownerName: 'Jordan Woods',
    ownerEmail: 'jordan.w@campus.edu',
    reportType: 'lost',
    itemName: 'North Face Surge Backpack (Dark Heather Gray)',
    category: 'Bags',
    description: 'Accidentally left in Lecture Hall 101 after Organic Chemistry. Contains spiral notebook, lab manual, and green pencil case.',
    location: 'Lecture Hall 101 (Life Sciences Building)',
    eventDate: '2026-10-02',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Small rip on the left mesh bottle pocket; keychain with Seattle Space Needle.',
    contactPreference: 'email',
    status: 'Active',
  },
  {
    ownerId: 'student_chloe_t',
    ownerName: 'Chloe Taylor',
    ownerEmail: 'chloe.t@campus.edu',
    reportType: 'found',
    itemName: 'Ray-Ban Clubmaster Classic Sunglasses',
    category: 'Accessories',
    description: 'Found sitting on the patio table outside the campus Starbucks. Black and gold rims in brown leather case.',
    location: 'Campus Center Plaza (Outside Starbucks)',
    eventDate: '2026-09-29',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80',
    distinguishingFeatures: 'Gold rim, tortoise temple accents, cleaning cloth inside.',
    contactPreference: 'in_app',
    status: 'Returned / Resolved',
  },
];

export async function seedInitialCampusItemsIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'items'));
    if (snap.docs.length > 0) {
      return false; // Database already has live items
    }

    const batch = writeBatch(db);
    const now = new Date();

    for (let i = 0; i < SAMPLE_CAMPUS_ITEMS.length; i++) {
      const itemData = SAMPLE_CAMPUS_ITEMS[i];
      const id = `campus_sample_${i + 1}`;
      const itemDocRef = doc(db, 'items', id);
      const createdAt = new Date(now.getTime() - i * 3600 * 1000 * 12).toISOString();
      const normalizedName = itemData.itemName.trim().toLowerCase();
      const keywords = extractKeywords(`${itemData.itemName} ${itemData.category} ${itemData.description} ${itemData.location} ${itemData.distinguishingFeatures || ''}`).join(' ');

      const record: ItemReport = {
        ...itemData,
        id,
        normalizedName,
        keywords,
        createdAt,
        updatedAt: createdAt,
      };

      batch.set(itemDocRef, record);
    }

    await batch.commit();
    return true;
  } catch (err) {
    console.warn('Seed operation skipped or permission denied:', err);
    return false;
  }
}
