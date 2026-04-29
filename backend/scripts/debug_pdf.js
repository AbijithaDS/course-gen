const { PDFParse } = require('pdf-parse');
try {
  const instance = new PDFParse();
  console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
} catch (e) {
  console.log('Error creating instance:', e.message);
}
