/**
 * AUTO-GENERATED Arc contract for `arc_demo` (program `app_demo.4gl`,
 * forms: alta.per, desc.per, form_1.per, portada.per).
 *
 * Produced by scripts/generate-contract.mjs - do not edit by hand. `make`
 * regenerates it whenever a .4gl or .per file changes.
 */
import type { ReactiveRecord, Session as ArcSession } from '@4js-ai/arc-client';

export namespace ArcDemo {
  /** Fields of the form currently open, one interface per form. */
  export namespace Forms {
    export interface AltaFields {
      codigo: string;
      descripcion: string;
      codigop: string;
      tipo: string;
    }
    export interface DescFields {
      descripcion: string;
    }
    export interface Form1Fields {
      empr_alb: string;
      nume_alb: number;
      stat_alb: string;
      clie_alb: string;
      nomb_cli: string;
      tiene: string;
    }
    export interface PortadaFields {

    }
  }

  /** Union of all forms: windows are stacked, a field is a field wherever it sits. */
  export interface Fields {
    codigo: string;
    descripcion: string;
    codigop: string;
    tipo: string;
    empr_alb: string;
    nume_alb: number;
    stat_alb: string;
    clie_alb: string;
    nomb_cli: string;
    tiene: string;
  }

  export type Action = 'albaranes' | 'desc' | 'alta' | 'sal' | 'cancel' | 'close' | 'yes' | 'no' | 'help';

  export interface Session extends Omit<ArcSession, 'fields' | 'actions'> {
    readonly fields: ReactiveRecord<Fields>;
    readonly actions: Record<Action, () => Promise<void>>;
  }
}

/** Screen records (DISPLAY/INPUT ARRAY lists) and their columns. */
export const ArcDemoLists = {
    s_consulta: ["empr_alb","nume_alb","stat_alb","clie_alb","nomb_cli","tiene"], // form form_1
} as const;

export const ArcDemo = {
  __app: 'arc_demo',
} as unknown as { __app: string; __session: ArcDemo.Session };
