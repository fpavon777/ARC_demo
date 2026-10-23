-- =============================================================================
#+ Library to choose the application language of the current session.
-- =============================================================================

-- Languages with a strings/<code>/ directory. Keep in sync with LANGS in the Makefile.
PRIVATE CONSTANT C_IDIOMAS = "es en"
PRIVATE CONSTANT C_DEFECTO = "es"

-- Language chosen for this session by idioma_usuario()
PRIVATE DEFINE m_idioma STRING

-- =============================================================================
#+ Returns the language code to use for this session.
#+
#+ Order of precedence:
#+  1. First program argument (set by the GAS connector of each language,
#+     e.g. arc_demo_en.xcf), if it is a supported language.
#+  2. The user's preferred language asked to the front end (standard.feInfo
#+     userPreferredLang): the browser language with GBC, the operating system
#+     language with GDC. Not used with Arc: its gateway does not deliver front
#+     calls made before the first dialog, so the program would wait forever.
#+  3. The default language.
#+
#+ Only the language part is used ("es_ES" and "es-ES" give "es").
#+
#+ @return Language code, one of the supported ones
-- =============================================================================

PUBLIC FUNCTION idioma_usuario() RETURNS STRING

  LET m_idioma = elegir_idioma()
  RETURN m_idioma

END FUNCTION

-- =============================================================================
#+ Language chosen for this session by idioma_usuario(); the default one if it
#+ has not been called yet.
#+
#+ @return Language code
-- =============================================================================

PUBLIC FUNCTION idioma_actual() RETURNS STRING

  IF m_idioma IS NULL THEN
    RETURN C_DEFECTO
  END IF
  RETURN m_idioma

END FUNCTION

-- Applies the precedence rules documented in idioma_usuario().
PRIVATE FUNCTION elegir_idioma() RETURNS STRING

  DEFINE l_code STRING
  DEFINE l_pref STRING

  LET l_code = soportado(arg_val(1))
  IF l_code IS NOT NULL THEN
    RETURN l_code
  END IF

  IF ui.Interface.getFrontEndName() != "Arc" THEN
    TRY
      CALL ui.Interface.frontCall("standard", "feInfo", ["userPreferredLang"], [l_pref])
    CATCH
      LET l_pref = NULL
    END TRY
    LET l_code = soportado(l_pref)
    IF l_code IS NOT NULL THEN
      RETURN l_code
    END IF
  END IF

  RETURN C_DEFECTO

END FUNCTION

-- Language part of a locale if it is a supported language, else NULL.
PRIVATE FUNCTION soportado(p_loc STRING) RETURNS STRING

  DEFINE l_code STRING
  DEFINE l_list STRING

  IF p_loc.getLength() < 2 THEN
    RETURN NULL
  END IF
  LET l_code = p_loc.subString(1, 2).toLowerCase()
  LET l_list = " " || C_IDIOMAS || " "
  IF l_list.getIndexOf(" " || l_code || " ", 1) > 0 THEN
    RETURN l_code
  END IF
  RETURN NULL

END FUNCTION
