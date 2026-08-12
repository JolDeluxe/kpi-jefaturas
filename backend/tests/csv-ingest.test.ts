import { describe, expect, it } from "vitest";
import { parseKpiCsvContent } from "../src/utils/csv-ingest.js";

const header = "01 Año,02 Mes,04 Id Cargo,03 Orden,05 Puesto,06 Id,07 Valor,08 KPI,09 Resultado,10 Objetivo,11 Valor Real,12 Calificacion,13 Tendencia,14 Parametros,15 Suma Valor,16 Suma Calificacion,17 Calificacion General";

describe("parser CSV KPI", () => {
  it("conserva raw con $, %, unidades y NA", () => {
    const csv = `${header}
2026,1,201,1,JEFATURA DE CONTABILIDAD,20101,10,KPI TEST,"$ 1,234.50 ","80 % ","NA ",0,3,"95 %  -  100 %<BR>Menor a 2 dias",95,75,78.9 %`;
    const [row] = parseKpiCsvContent(csv);
    expect(row.resultadoRaw).toContain("$ 1,234.50");
    expect(row.objetivoRaw).toContain("80 %");
    expect(row.valorRealRaw).toContain("NA");
    expect(row.parametrosRaw).toContain("<BR>");
    expect(row.resultadoNumero).toBe(1234.5);
    expect(row.valorRealNumero).toBeNull();
  });

  it("rechaza CSV invalido sin producir filas parciales", () => {
    expect(() => parseKpiCsvContent("bad,headers\n1,2")).toThrow(/Encabezados invalidos/);
  });

  it("rechaza CSV vacio", () => {
    expect(() => parseKpiCsvContent(`${header}\n`)).toThrow(/CSV vacio/);
  });
});
