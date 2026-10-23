-- =============================================================================
#+ Demo program body: ring menu and the albaranes, descripcion and alta windows.
#+
#+ Loaded from main.4gl once the application language has been set, so every
#+ %"key" literal of this module is resolved in the user's language.
-- =============================================================================

IMPORT json

-- Logical database name: see dbi.database.arc_demo.* in fglprofile and db/schema.sql
PRIVATE CONSTANT C_BD = "arc_demo"

TYPE t_consulta RECORD
    empr_alb   CHAR(10),
    nume_alb   INTEGER,
    stat_alb   CHAR(1),
    clie_alb   CHAR(10),
    nomb_cli   CHAR(40),
    tiene      CHAR(1)
END RECORD

-- =============================================================================
#+ Runs the program: opens the start window and the main ring menu.
-- =============================================================================

PUBLIC FUNCTION run() RETURNS ()

  CALL ui.Interface.loadStyles("demo")
  OPEN WINDOW w1 WITH FORM "portada" ATTRIBUTE(style="main", text=%"app.titulo")
  CALL ui.Window.getCurrent().getForm().setElementText("l2", SFMT(%"portada.fecha", TODAY))
  -- the countries combobox of the alta form is filled from the database
  TRY
    CONNECT TO C_BD AS "main"
  CATCH
    ERROR SFMT(%"error.bd", sqlca.sqlcode, SQLERRMESSAGE)
  END TRY
  MENU %"menu.titulo"

    ON ACTION albaranes ATTRIBUTES(TEXT=%"menu.albaranes", COMMENT=%"menu.albaranes.comment")
      CALL consulta()

    ON ACTION desc ATTRIBUTES(TEXT=%"menu.desc", COMMENT=%"menu.desc.comment", IMAGE="check")
      CALL descripcion()

    ON ACTION alta ATTRIBUTES(TEXT=%"menu.alta", COMMENT=%"menu.alta.comment", IMAGE="new")
      CALL alta()

    ON ACTION sal ATTRIBUTES(TEXT=%"menu.sal", ACCELERATOR="f9", IMAGE="exit")
      EXIT MENU

  END MENU
  CLOSE WINDOW w1
  TRY
    DISCONNECT "main"
  CATCH
    -- no connection was opened
  END TRY

END FUNCTION

FUNCTION consulta()

  DEFINE
    arr_consulta DYNAMIC ARRAY OF t_consulta,
    reader json.JSONReader,
    i, j SMALLINT

  LET reader = json.JSONReader.Create()
  CALL reader.readFrom("file_1.json")
  CALL reader.next()
  CALL json.Serializer.JSONToVariable(reader, arr_consulta)
  CALL reader.close()

  OPEN WINDOW w2 WITH FORM "form_1" ATTRIBUTE(text=%"win.albaranes")

  MESSAGE %"msg.salir"
  input ARRAY arr_consulta without defaults from s_consulta.* ATTRIBUTE(UNBUFFERED)

      before INSERT
        let arr_consulta[dialog.getCurrentRow("s_consulta")].tiene = "N"

      on action cancel ATTRIBUTE(accelerator="f9")
        EXIT input

      on action close
        exit input

  END input
  CLOSE WINDOW w2

END FUNCTION

FUNCTION descripcion()

  DEFINE descripcion	char(500)

  LET descripcion = "Ejemplo de texto - Hola mundo - Descripcion breve - Texto de muestra para la demo - Prueba de cadena larga"
  OPEN WINDOW w3 WITH FORM "desc" ATTRIBUTE(text=%"win.desc", style="main3")
  MESSAGE %"msg.salir"
  INPUT BY NAME descripcion WITHOUT DEFAULTS

    AFTER INPUT
      IF confirmar(%"conf.desc.titulo", %"conf.desc.texto") THEN
        EXIT INPUT
      ELSE
        CONTINUE INPUT
      END IF

    ON action cancel ATTRIBUTE(accelerator="f9")
      EXIT INPUT

  END INPUT
  CLOSE WINDOW w3

END FUNCTION

FUNCTION alta()

  DEFINE
    l_rec RECORD
      codigo CHAR(3),
      descripcion CHAR(100),
      tipo CHAR(1),
      codigop CHAR(2)
    END RECORD

  OPEN WINDOW w4 AT 4, 4 WITH FORM "alta" ATTRIBUTE(text=%"win.alta")
  MESSAGE %"msg.salir"
  INITIALIZE l_rec TO NULL
  INPUT BY NAME l_rec.*

    AFTER INPUT
      IF confirmar(%"conf.alta.titulo", %"conf.alta.texto") THEN
        EXIT INPUT
      ELSE
        CONTINUE INPUT
      END IF

    ON action cancel ATTRIBUTE(ACCELERATOR="f9")
      EXIT INPUT

  END INPUT
  CLOSE WINDOW w4

END FUNCTION

-- =============================================================================
#+ Asks a yes/no question in a modal dialog.
#+
#+ Replacement for the legacy fgl_winquestion(), which does not exist in
#+ Genero 6. Rendered as a modal window by GBC/GDC and as a prompt by Arc.
#+
#+ @param title  Dialog title
#+ @param text   Question shown to the user
#+
#+ @return TRUE if the user answered yes
-- =============================================================================

FUNCTION confirmar(title STRING, text STRING) RETURNS BOOLEAN

  DEFINE l_yes BOOLEAN

  LET l_yes = FALSE
  MENU title ATTRIBUTES(STYLE="dialog", COMMENT=text, IMAGE="question")
    ON ACTION yes ATTRIBUTES(TEXT=%"conf.si")
      LET l_yes = TRUE
    ON ACTION no ATTRIBUTES(TEXT=%"conf.no")
      LET l_yes = FALSE
  END MENU
  RETURN l_yes

END FUNCTION
