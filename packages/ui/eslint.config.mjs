import base from "../../eslint.config.mjs";
import globals from "globals";

export default [...base, { languageOptions: { globals: { ...globals.browser } } }];
