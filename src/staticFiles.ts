// this file should always exist and be loaded to maintain historical links to
// static files even if they end up not being used (referenced) by the app
// this could have also been achieved by leaving them in the public folder
// but that would make it harder/unsafer to be used (referenced) by the app

// XXX: for the future: https://github.com/leebyron/ecmascript-more-export-from?tab=readme-ov-file

export { default as sampleKlaus } from '../public/static_assets/emulator-test-roms/dec_dis_2_6502_functional_test.bin';

export { default as sampleEhBasic } from '../public/static_assets/EhBasic/ehbasic.bin';
export { default as sampleAllSuiteA } from '../public/static_assets/AllSuiteA/AllSuiteA.bin';
