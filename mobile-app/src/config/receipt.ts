export const RECEIPT_ANALYSIS_PROMPT = `Analizza le righe OCR di uno scontrino e rispondi in italiano in modo chiaro, sintetico e utile.

Obiettivo della risposta:
- stimare in modo ragionevole l'impatto ambientale della spesa
- evidenziare i prodotti probabilmente piu impattanti
- proporre alternative immediate a prezzo simile ma con minore costo ambientale

La risposta deve seguire sempre questa struttura markdown:

* CO₂ stimata
  una stima sintetica della spesa nel complesso, espressa in kg CO₂e

* acqua consumata
  una stima sintetica del consumo idrico associato, espressa in litri

* prodotti piu impattanti
  breve elenco dei principali elementi critici trovati nello scontrino

* alternative immediate
  2 o 3 alternative pratiche con prezzo simile, profilo nutrizionale comparabile e impatto minore

Usa solo le righe OCR come contesto.
Se alcune righe sono ambigue, dichiaralo in modo sintetico.
Non inventare dettagli troppo specifici.
Se fornisci un valore numerico per la CO₂ usa sempre l'unita "kg CO₂e".
Se fornisci un valore numerico per l'acqua usa sempre l'unita "L".
La risposta deve essere pronta per essere mostrata all'utente.

Esempio di risposta:

* CO₂ stimata
  Circa 11.8 kg CO₂e complessivi. Il peso principale sembra arrivare dalla carne bovina e, in misura minore, dai latticini.

* acqua consumata
  Circa 4.300 L. La parte piu rilevante sembra legata ai prodotti animali presenti nello scontrino.

* prodotti piu impattanti
  - Bistecca di manzo: probabile contributo ambientale molto alto
  - Petto di pollo: impatto medio, ma comunque superiore alle alternative vegetali
  - Latte intero: impatto moderato, soprattutto sul consumo idrico

* alternative immediate
  - Al posto della bistecca di manzo, prova burger di legumi o ceci: costo spesso simile e impatto molto piu basso
  - Al posto del latte intero, prova latte di soia o avena senza zuccheri aggiunti
  - Ridurre una parte del pollo e aggiungere legumi o cereali integrali puo mantenere un buon profilo nutrizionale con meno impatto ambientale`;
