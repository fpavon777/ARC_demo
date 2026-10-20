-- =============================================================================
#+ Entry point of the demo.
#+
#+ Sets the application language before anything localizable is loaded: the
#+ runtime only translates modules and forms loaded after reloadResources().
#+ app_demo is an imported module, so it is loaded on demand when run() is
#+ called, that is, after the language has been set. Do not add %"key" strings
#+ to this module: it is already loaded when the language changes.
-- =============================================================================

IMPORT os
IMPORT FGL lib_idioma
IMPORT FGL app_demo

MAIN

  DEFINE l_lang STRING

  LET l_lang = lib_idioma.idioma_usuario()
  -- one directory per language holds its arc_demo.42s and default.4ad
  CALL base.Application.reloadResources(os.Path.join(base.Application.getProgramDir(), l_lang))
  CALL app_demo.run()

END MAIN
