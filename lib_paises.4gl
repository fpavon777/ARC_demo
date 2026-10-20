-- =============================================================================
#+ Library of COMBOBOX initializers shared by the forms of the demo.
-- =============================================================================

-- =============================================================================
#+ Fills a COMBOBOX with ten countries (ISO 3166 alpha-2 code as key).
#+
#+ Meant to be used as INITIALIZER of a combobox form item, for example
#+ INITIALIZER = lib_paises.cargar_paises. The list has no NULL item: pair it
#+ with NOT NULL in the form so the user must always pick a country. Country
#+ names are localizable strings (keys pais.XX in strings/<language>/).
#+
#+ @param cb  Combobox to fill
-- =============================================================================

PUBLIC FUNCTION cargar_paises(cb ui.ComboBox) RETURNS ()

  CALL cb.clear()
  CALL cb.addItem("ES", %"pais.ES")
  CALL cb.addItem("FR", %"pais.FR")
  CALL cb.addItem("DE", %"pais.DE")
  CALL cb.addItem("IT", %"pais.IT")
  CALL cb.addItem("PT", %"pais.PT")
  CALL cb.addItem("GB", %"pais.GB")
  CALL cb.addItem("US", %"pais.US")
  CALL cb.addItem("MX", %"pais.MX")
  CALL cb.addItem("AR", %"pais.AR")
  CALL cb.addItem("BR", %"pais.BR")

END FUNCTION
