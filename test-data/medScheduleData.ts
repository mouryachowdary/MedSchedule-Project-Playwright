export const pageTitle = 'Medicare Assignment';

export const doctorProfile = {
  avatarInitials: 'DS',
  name: 'Dr. Sarah Mitchell',
  designation: 'Cardiologist',
  qualification: 'MD, FACC — Board Certified',
  ratingText: /4\.9\s*\(237 reviews\)/,
};

export const patients = {
  '007': {
    name: 'James Bond',
    idText: '007',
    selectedLabel: 'James Bond (007)',
  },
  '008': {
    name: 'Jane Smith',
    idText: '008',
    selectedLabel: 'Jane Smith (008)',
  },
} as const;

export const availableSlots = [
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
];
