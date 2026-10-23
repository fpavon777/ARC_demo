-- Countries shown in the combobox of the Alta form, with their name in each language
-- (idioma = language code of strings/<lang>/). A new language needs rows, not columns.
CREATE TABLE IF NOT EXISTS paises (
  codigo CHAR(2)     NOT NULL,   -- ISO 3166 alpha-2
  idioma CHAR(2)     NOT NULL,   -- es, en, ...
  nombre VARCHAR(60) NOT NULL,
  PRIMARY KEY (codigo, idioma)
);
