export type LanguageType = 'en' | 'bn';

export interface TranslationSet {
  // Navigation
  appName: string;
  dashboard: string;
  addTransaction: string;
  transactionHistory: string;
  visualAnalytics: string;
  budgetGoals: string;
  userProfile: string;
  settings: string;
  tools: string;
  toolsAndFeatures: string;
  signOut: string;
  home: string;
  add: string;
  stats: string;
  profile: string;
  history: string;

  // Header / Common
  totalBalance: string;
  totalIncome: string;
  totalExpense: string;
  periodNet: string;
  activeBudget: string;
  currencySymbol: string;
  income: string;
  expense: string;
  amount: string;
  category: string;
  date: string;
  description: string;
  loading: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  confirm: string;
  search: string;
  all: string;
  weekly: string;
  monthly: string;
  yearly: string;
  custom: string;
  filter: string;

  // Categories
  catBazar: string;
  catRickshawCNG: string;
  catMobileRecharge: string;
  catRent: string;
  catUtilities: string;
  catTuition: string;
  catHostel: string;
  catFood: string;
  catShopping: string;
  catHealth: string;
  catEntertainment: string;
  catSalary: string;
  catOther: string;
  catInvestment: string;
  catGift: string;

  // Alert
  financialStretchAlert: string;
  overBudgetWarning: string;
  savingTip: string;
  notification: string;
  noNotifications: string;
  notificationsTitle: string;

  // Dashboard Specific
  quickActions: string;
  exportPdf: string;
  exportExcel: string;
  remainingBudget: string;
  recentTransactions: string;
  viewAll: string;
  days7Trend: string;
  monthComparison: string;
  noTransactions: string;

  // Budget Screen
  setBudgetTitle: string;
  setBudgetDesc: string;
  enterBudgetAmount: string;
  saveBudget: string;
  budgetStatusHealthy: string;
  budgetStatusModerate: string;
  budgetStatusHeavy: string;
  budgetStatusCritical: string;

  // User Screen & Profile settings
  editProfile: string;
  displayName: string;
  gender: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  uploadedAvatar: string;
  registrationDate: string;
  changePassword: string;
  successProfileUpdate: string;

  // Settings
  appSettings: string;
  theme: string;
  themeDark: string;
  themeLight: string;
  appLanguage: string;
  languageSelect: string;
  securitySettings: string;

  // Login View
  welcomeBack: string;
  loginSub: string;
  loginWithEmail: string;
  emailLabel: string;
  passwordLabel: string;
  signIn: string;
  signUp: string;
  noAccount: string;
  haveAccount: string;
  resetPassword: string;

  // Currency Exchange
  currencyExchangeTitle: string;
  currencyExchangeSubtitle: string;
  searchShopsPlaceholder: string;
  listView: string;
  mapView: string;
  calculatorTitle: string;
  amountToExchange: string;
  selectShop: string;
  youWillReceive: string;
  exchangeRate: string;
  getDirections: string;
  distance: string;
  address: string;
  useCurrentLocation: string;
}

export const translations: Record<LanguageType, TranslationSet> = {
  en: {
    appName: 'Digital Hishab',
    dashboard: 'Dashboard',
    addTransaction: 'Add Transaction',
    transactionHistory: 'Transaction History',
    visualAnalytics: 'Visual Analytics',
    budgetGoals: 'Budget',
    userProfile: 'User Profile',
    settings: 'Settings',
    tools: 'Tools',
    toolsAndFeatures: 'Tools & Features',
    signOut: 'Sign Out',
    home: 'Home',
    add: 'Add',
    stats: 'Stats',
    profile: 'Profile',
    history: 'History',

    totalBalance: 'Total Balance',
    totalIncome: 'Total Income',
    totalExpense: 'Total Expense',
    periodNet: 'Period Net',
    activeBudget: 'Active Budget',
    currencySymbol: '৳',
    income: 'Income',
    expense: 'Expense',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    description: 'Description',
    loading: 'Loading App...',
    cancel: 'Cancel',
    save: 'Save Changes',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    search: 'Search...',
    all: 'All',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
    filter: 'Filter',

    catBazar: 'Bazar',
    catRickshawCNG: 'Rickshaw/CNG',
    catMobileRecharge: 'Mobile Recharge',
    catRent: 'Rent',
    catUtilities: 'Utilities',
    catTuition: 'Tuition',
    catHostel: 'Hostel',
    catFood: 'Food',
    catShopping: 'Shopping',
    catHealth: 'Health',
    catEntertainment: 'Entertainment',
    catSalary: 'Salary',
    catOther: 'Other',
    catInvestment: 'Investment',
    catGift: 'Gift',

    financialStretchAlert: 'Financial Stretch Alert',
    overBudgetWarning: 'You have exceeded your budget! Consider reviewing your expenses to regain control.',
    savingTip: 'Always track small expenses like Rickshaw/CNG to avoid "financial leaks".',
    notification: 'Notification',
    noNotifications: 'No notifications',
    notificationsTitle: 'Notifications',

    quickActions: 'Quick Actions',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    remainingBudget: 'Remaining Budget',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View All',
    days7Trend: '7 Days Trend',
    monthComparison: 'Month Comparison',
    noTransactions: 'No transactions found for the selected period.',

    setBudgetTitle: 'Budget Rules',
    setBudgetDesc: 'Maintain your health! Set a monthly limit to receive glowing alerts whenever your balance is pushed.',
    enterBudgetAmount: 'Enter Budget Amount',
    saveBudget: 'Save Budget Goals',
    budgetStatusHealthy: 'Healthy',
    budgetStatusModerate: 'Moderate',
    budgetStatusHeavy: 'Heavy',
    budgetStatusCritical: 'Critical',

    editProfile: 'Edit Profile Info',
    displayName: 'Display Name',
    gender: 'Gender',
    genderMale: 'Male',
    genderFemale: 'Female',
    genderOther: 'Other',
    uploadedAvatar: 'Uploaded Avatar',
    registrationDate: 'Registration Date',
    changePassword: 'Change Password',
    successProfileUpdate: 'Profile updated successfully!',

    appSettings: 'Application Settings',
    theme: 'UI Theme Mode',
    themeDark: 'Dark Theme',
    themeLight: 'Light Theme',
    appLanguage: 'Application Language',
    languageSelect: 'Select Language',
    securitySettings: 'Security Settings',

    welcomeBack: 'Welcome to Digital Hishab',
    loginSub: 'Manage your daily income, expenses and budget with beautiful analytics.',
    loginWithEmail: 'Login with Email',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    noAccount: 'Don\'t have an account?',
    haveAccount: 'Already have an account?',
    resetPassword: 'Forgot Password?',

    currencyExchangeTitle: 'Nearby Currency Exchange',
    currencyExchangeSubtitle: 'Find verified local money changers and calculate your exchange amounts',
    searchShopsPlaceholder: 'Search shop name or location...',
    listView: 'List View',
    mapView: 'Map View',
    calculatorTitle: 'Exchange Calculator',
    amountToExchange: 'Amount to Exchange',
    selectShop: 'Select a Shop',
    youWillReceive: 'You Will Receive',
    exchangeRate: 'Exchange Rate',
    getDirections: 'Get Directions',
    distance: 'Distance',
    address: 'Address',
    useCurrentLocation: 'Use Current Location',
  },
  bn: {
    appName: 'ডিজিটাল হিসাব',
    dashboard: 'ড্যাশবোর্ড',
    addTransaction: 'লেনদেন যোগ করুন',
    transactionHistory: 'লেনদেনের ইতিহাস',
    visualAnalytics: 'গ্রাফিক্যাল বিশ্লেষণ',
    budgetGoals: 'বাজেট',
    userProfile: 'ইউজার প্রোফাইল',
    settings: 'সেটিংস',
    tools: 'টুলস',
    toolsAndFeatures: 'টুলস ও ফিচার',
    signOut: 'লগ আউট',
    home: 'হোম',
    add: 'যোগ করুন',
    stats: 'বিশ্লেষণ',
    profile: 'প্রোফাইল',
    history: 'ইতিহাস',

    totalBalance: 'মোট ব্যালেন্স',
    totalIncome: 'মোট আয়',
    totalExpense: 'মোট ব্যয়',
    periodNet: 'নিট লাভ/ক্ষতি',
    activeBudget: 'সক্রিয় বাজেট',
    currencySymbol: '৳',
    income: 'আয়',
    expense: 'ব্যয়',
    amount: 'টাকার পরিমাণ',
    category: 'ক্যাটাগরি',
    date: 'তারিখ',
    description: 'বিবরণ',
    loading: 'অ্যাপ লোড হচ্ছে...',
    cancel: 'বাতিল',
    save: 'পরিবর্তন সংরক্ষণ করুন',
    edit: 'সম্পাদনা',
    delete: 'মুছে ফেলুন',
    confirm: 'নিশ্চিত করুন',
    search: 'অনুসন্ধান করুন...',
    all: 'সব',
    weekly: 'সাপ্তাহিক',
    monthly: 'মাসিক',
    yearly: 'বার্ষিক',
    custom: 'কাস্টম',
    filter: 'ফিল্টার',

    catBazar: 'বাজার',
    catRickshawCNG: 'রিকশা / সিএনজি',
    catMobileRecharge: 'মোবাইল রিচার্জ',
    catRent: 'ভাড়া',
    catUtilities: 'ইউটিলিটি বিল',
    catTuition: 'টিউশনি',
    catHostel: 'হোস্টেল',
    catFood: 'খাবার',
    catShopping: 'কেনাকাটা',
    catHealth: 'স্বাস্থ্য',
    catEntertainment: 'বিনোদন',
    catSalary: 'বেতন',
    catOther: 'অন্যান্য',
    catInvestment: 'বিনিয়োগ',
    catGift: 'উপহার',

    financialStretchAlert: 'আর্থিক টান সতর্কবার্তা',
    overBudgetWarning: 'আপনি আপনার বাজেট অতিক্রম করেছেন! নিয়ন্ত্রণ ফিরে পেতে আপনার ব্যয় পর্যালোচনা করুন।',
    savingTip: '"আর্থিক অপচয়" এড়াতে সবসময় রিকশা/সিএনজির মতো ছোট ছোট ব্যয়গুলো ট্র্যাক করুন।',
    notification: 'বিজ্ঞপ্তি',
    noNotifications: 'কোনো বিজ্ঞপ্তি নেই',
    notificationsTitle: 'বিজ্ঞপ্তিসমূহ',

    quickActions: 'দ্রুত অ্যাকশন',
    exportPdf: 'পিডিএফ ডাউনলোড',
    exportExcel: 'এক্সেল ডাউনলোড',
    remainingBudget: 'অবশিষ্ট বাজেট',
    recentTransactions: 'সাম্প্রতিক লেনদেনসমূহ',
    viewAll: 'সব দেখুন',
    days7Trend: '৭ দিনের ট্রেন্ড',
    monthComparison: 'মাসিক তুলনা',
    noTransactions: 'নির্বাচিত সময়ের জন্য কোনো লেনদেন পাওয়া যায়নি।',

    setBudgetTitle: 'বাজেট নিয়মাবলী',
    setBudgetDesc: 'আর্থিক সচ্ছলতা বজায় রাখুন! মাসিক সীমা নির্ধারণ করুন যাতে আপনার ব্যালেন্স সীমা অতিক্রম করলে সতর্কবার্তা পান।',
    enterBudgetAmount: 'বাজেটের পরিমাণ লিখুন',
    saveBudget: 'বাজেট লক্ষ্য সংরক্ষণ করুন',
    budgetStatusHealthy: 'স্বাভাবিক',
    budgetStatusModerate: 'মধ্যম',
    budgetStatusHeavy: 'উচ্চ',
    budgetStatusCritical: 'আশঙ্কাজনক',

    editProfile: 'প্রোফাইল তথ্য পরিবর্তন করুন',
    displayName: 'প্রদর্শিত নাম',
    gender: 'লিঙ্গ',
    genderMale: 'পুরুষ',
    genderFemale: 'নারী',
    genderOther: 'অন্যান্য',
    uploadedAvatar: 'আপলোডকৃত অ্যাভাটার',
    registrationDate: 'নিবন্ধনের তারিখ',
    changePassword: 'পাসওয়ার্ড পরিবর্তন করুন',
    successProfileUpdate: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',

    appSettings: 'অ্যাপ্লিকেশন সেটিংস',
    theme: 'থিম মোড',
    themeDark: 'ডার্ক থিম',
    themeLight: 'লাইট থিম',
    appLanguage: 'অ্যাপ্লিকেশন ভাষা',
    languageSelect: 'ভাষা নির্বাচন করুন',
    securitySettings: 'নিরাপত্তা সেটিংস',

    welcomeBack: 'ডিজিটাল হিসাবে স্বাগতম',
    loginSub: 'মনোরম বিশ্লেষণের মাধ্যমে আপনার দৈনন্দিন আয়, ব্যয় এবং বাজেট পরিচালনা করুন।',
    loginWithEmail: 'ইমেইল দিয়ে লগইন করুন',
    emailLabel: 'ইমেইল ঠিকানা',
    passwordLabel: 'পাসওয়ার্ড',
    signIn: 'লগইন করুন',
    signUp: 'নিবন্ধন করুন',
    noAccount: 'কোনো অ্যাকাউন্ট নেই?',
    haveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    resetPassword: 'পাসওয়ার্ড ভুলে গেছেন?',

    currencyExchangeTitle: 'নিকটস্থ মুদ্রা বিনিময় কেন্দ্র',
    currencyExchangeSubtitle: 'নিকটস্থ অনুমোদিত মানি এক্সচেঞ্জ খুঁজুন ও সঠিক বিনিময় হার হিসাব করুন',
    searchShopsPlaceholder: 'দোকানের নাম বা এলাকা খুঁজুন...',
    listView: 'তালিকা দেখুন',
    mapView: 'ম্যাপ দেখুন',
    calculatorTitle: 'মুদ্রা রূপান্তর ক্যালকুলেটর',
    amountToExchange: 'বিনিময়ের পরিমাণ',
    selectShop: 'একটি শপ নির্বাচন করুন',
    youWillReceive: 'আপনি পাবেন',
    exchangeRate: 'বিনিময় হার',
    getDirections: 'দিকনির্দেশনা',
    distance: 'দূরত্ব',
    address: 'ঠিকানা',
    useCurrentLocation: 'বর্তমান অবস্থান ব্যবহার করুন',
  }
};
