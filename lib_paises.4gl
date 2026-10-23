-- =============================================================================
#+ Library of COMBOBOX initializers shared by the forms of the demo.
#+
#+ The data comes from the table paises of the PostgreSQL database arc_demo
#+ (see db/schema.sql). The program must have a connection open when the form
#+ that uses the initializer is displayed.
-- =============================================================================

IMPORT FGL lib_idioma

-- Language of the rows to read when the session language has none.
PRIVATE CONSTANT C_IDIOMA_DEFECTO = "es"

-- =============================================================================
#+ Fills a COMBOBOX with the countries of the table paises.
#+
#+ Meant to be used as INITIALIZER of a combobox form item, for example
#+ INITIALIZER = lib_paises.cargar_paises. The names are read in the language
#+ of the session (lib_idioma.idioma_actual), with a cursor over the table,
#+ ordered by name; if the table has no rows for that language the default
#+ language is used. The list has no NULL item: pair it with NOT NULL in the
#+ form so the user must always pick a country. If the database cannot be read
#+ an error message is shown and the list stays empty.
#+
#+ @param cb  Combobox to fill
-- =============================================================================

PUBLIC FUNCTION cargar_paises(cb ui.ComboBox) RETURNS ()

  DEFINE l_idioma STRING
  DEFINE l_n INTEGER

  CALL cb.clear()
  LET l_idioma = lib_idioma.idioma_actual()
  LET l_n = cargar_idioma(cb, l_idioma)
  IF l_n = 0 AND l_idioma != C_IDIOMA_DEFECTO THEN
    LET l_n = cargar_idioma(cb, C_IDIOMA_DEFECTO)
  END IF
  IF l_n < 0 THEN
    ERROR SFMT(%"error.paises", sqlca.sqlcode)
  END IF

END FUNCTION

-- Adds to the combobox the countries named in a language. Returns how many, or -1 if the
-- database could not be read. TRY/CATCH only covers the statements written inside the
-- block, not the functions it calls, so the SQL and its TRY live in the same function.
PRIVATE FUNCTION cargar_idioma(cb ui.ComboBox, p_idioma STRING) RETURNS INTEGER

  DEFINE l_cod CHAR(2)
  DEFINE l_nom VARCHAR(60)
  DEFINE l_n INTEGER

  LET l_n = 0
  TRY
    DECLARE c_paises CURSOR FOR
      SELECT codigo, nombre FROM paises WHERE idioma = $p_idioma ORDER BY nombre
    FOREACH c_paises INTO l_cod, l_nom
      CALL cb.addItem(l_cod, l_nom)
      LET l_n = l_n + 1
    END FOREACH
    FREE c_paises
  CATCH
    RETURN -1
  END TRY
  RETURN l_n

END FUNCTION
