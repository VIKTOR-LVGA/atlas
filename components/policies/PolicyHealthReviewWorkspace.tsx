"use client";

import { useMemo, useState } from "react";
import { Trash2, UserMinus, UserPlus } from "lucide-react";
import type {
  HealthReviewCoverage,
  HealthReviewPerson,
  HealthReviewState,
} from "@/lib/health-policy-review";
import { formatCHF } from "@/lib/utils";

function NumberInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value ?? ""}
        onChange={(event) => {
          const next = event.target.value.trim();
          onChange(next ? Number(next) : null);
        }}
        className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function personLabel(person: HealthReviewPerson) {
  return person.name?.trim() || "Persona assicurata";
}

function CoverageEditor({
  coverage,
  allPeople,
  assignedToPersonKey,
  onChange,
  onAssign,
  onRemove,
  removeLabel,
}: {
  coverage: HealthReviewCoverage;
  allPeople: HealthReviewPerson[];
  assignedToPersonKey: string | null;
  onChange: (coverage: HealthReviewCoverage) => void;
  onAssign: (personStableKey: string) => void;
  onRemove: () => void;
  removeLabel: "unassign" | "remove";
}) {
  const assignedPerson = assignedToPersonKey
    ? allPeople.find((person) => person.stableKey === assignedToPersonKey)
    : null;

  const suggestedKey = coverage.suggested_person_stable_key ?? null;
  const suggestedName = coverage.suggested_person_name ?? null;
  const showSuggestion =
    Boolean(suggestedName) &&
    (!assignedToPersonKey || suggestedKey !== assignedToPersonKey);

  const initialSelect =
    !assignedToPersonKey && suggestedKey ? suggestedKey : "";

  const [assignTo, setAssignTo] = useState(initialSelect);

  const assignLabel = assignedToPersonKey ? "Sposta" : "Assegna";

  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-[10px] font-medium text-slate-500">Nome copertura</span>
          <input
            value={coverage.name}
            onChange={(event) =>
              onChange({ ...coverage, name: event.target.value })
            }
            className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label>
          <span className="text-[10px] font-medium text-slate-500">Tipo</span>
          <input
            value={coverage.coverage_type ?? coverage.category_label ?? ""}
            onChange={(event) =>
              onChange({
                ...coverage,
                coverage_type: event.target.value || null,
                category_label: event.target.value || null,
              })
            }
            className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <NumberInput
          label="Premio mensile (CHF)"
          value={coverage.premium_final}
          onChange={(premium_final) => onChange({ ...coverage, premium_final })}
        />
        <label className="sm:col-span-2">
          <span className="text-[10px] font-medium text-slate-500">Note</span>
          <input
            value={coverage.notes ?? ""}
            onChange={(event) =>
              onChange({ ...coverage, notes: event.target.value || null })
            }
            className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        {assignedPerson ? (
          <p className="text-[11px] text-slate-600">
            Assegnata a{" "}
            <span className="font-medium text-slate-800">
              {personLabel(assignedPerson)}
            </span>
          </p>
        ) : null}

        {showSuggestion ? (
          <p className="text-[11px] text-blue-700">
            Suggerito:{" "}
            <span className="font-medium">{suggestedName}</span>
          </p>
        ) : null}

        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[160px] flex-1">
            <span className="text-[10px] font-medium text-slate-500">Persona</span>
            <select
              value={assignTo}
              onChange={(event) => setAssignTo(event.target.value)}
              className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300"
            >
              <option value="">Scegli persona</option>
              {allPeople.map((person) => (
                <option key={person.stableKey} value={person.stableKey}>
                  {personLabel(person)}
                  {person.stableKey === suggestedKey ? " (suggerito)" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={!assignTo}
            onClick={() => {
              if (!assignTo || assignTo === assignedToPersonKey) {
                return;
              }

              onAssign(assignTo);
              setAssignTo("");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {assignLabel}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
          >
            {removeLabel === "unassign" ? (
              <UserMinus className="h-3.5 w-3.5" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {removeLabel === "unassign" ? "Lascia non assegnata" : "Rimuovi riga"}
          </button>
        </div>
      </div>
    </li>
  );
}

export function PolicyHealthReviewWorkspace({
  initialState,
  warnings,
}: {
  initialState: HealthReviewState;
  warnings: string[];
}) {
  const [state, setState] = useState<HealthReviewState>(initialState);
  const serialized = useMemo(() => JSON.stringify(state), [state]);

  const updatePerson = (
    personKey: string,
    patch: Partial<HealthReviewPerson>
  ) => {
    setState((current) => ({
      ...current,
      people: current.people.map((person) =>
        person.stableKey === personKey ? { ...person, ...patch } : person
      ),
    }));
  };

  const updatePersonCoverage = (
    personKey: string,
    coverageKey: string,
    coverage: HealthReviewCoverage
  ) => {
    setState((current) => ({
      ...current,
      people: current.people.map((person) =>
        person.stableKey === personKey
          ? {
              ...person,
              coverages: person.coverages.map((item) =>
                item.stableKey === coverageKey ? coverage : item
              ),
            }
          : person
      ),
    }));
  };

  const removePersonCoverage = (personKey: string, coverageKey: string) => {
    setState((current) => {
      const person = current.people.find((p) => p.stableKey === personKey);
      const coverage = person?.coverages.find((c) => c.stableKey === coverageKey);

      if (!person || !coverage) {
        return current;
      }

      return {
        ...current,
        people: current.people.map((p) =>
          p.stableKey === personKey
            ? {
                ...p,
                coverages: p.coverages.filter((c) => c.stableKey !== coverageKey),
              }
            : p
        ),
        unassigned: [
          ...current.unassigned,
          { ...coverage, assignment_source: coverage.assignment_source },
        ],
      };
    });
  };

  const reassignPersonCoverage = (
    fromPersonKey: string,
    coverageKey: string,
    toPersonKey: string
  ) => {
    if (fromPersonKey === toPersonKey) {
      return;
    }

    setState((current) => {
      const fromPerson = current.people.find((p) => p.stableKey === fromPersonKey);
      const coverage = fromPerson?.coverages.find((c) => c.stableKey === coverageKey);

      if (!fromPerson || !coverage) {
        return current;
      }

      return {
        ...current,
        people: current.people.map((person) => {
          if (person.stableKey === fromPersonKey) {
            return {
              ...person,
              coverages: person.coverages.filter((c) => c.stableKey !== coverageKey),
            };
          }

          if (person.stableKey === toPersonKey) {
            return {
              ...person,
              coverages: [
                ...person.coverages,
                { ...coverage, assignment_source: "manual" },
              ],
            };
          }

          return person;
        }),
      };
    });
  };

  const assignUnassigned = (coverageKey: string, personKey: string) => {
    setState((current) => {
      const coverage = current.unassigned.find((c) => c.stableKey === coverageKey);

      if (!coverage) {
        return current;
      }

      return {
        ...current,
        unassigned: current.unassigned.filter((c) => c.stableKey !== coverageKey),
        people: current.people.map((person) =>
          person.stableKey === personKey
            ? {
                ...person,
                coverages: [
                  ...person.coverages,
                  { ...coverage, assignment_source: "manual" },
                ],
              }
            : person
        ),
      };
    });
  };

  const updateUnassigned = (coverageKey: string, coverage: HealthReviewCoverage) => {
    setState((current) => ({
      ...current,
      unassigned: current.unassigned.map((item) =>
        item.stableKey === coverageKey ? coverage : item
      ),
    }));
  };

  const removeUnassigned = (coverageKey: string) => {
    setState((current) => ({
      ...current,
      unassigned: current.unassigned.filter((c) => c.stableKey !== coverageKey),
    }));
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="health_review_json" value={serialized} readOnly />

      <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2.5">
        <p className="text-[12px] font-medium text-amber-900">
          Revisione struttura estratta
        </p>
        <p className="mt-0.5 text-[11px] text-amber-800/90">
          Puoi assegnare ogni copertura a qualsiasi persona assicurata. Il
          suggerimento AI è solo un aiuto, non un vincolo.
        </p>
      </div>

      {warnings.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-[11px] text-slate-600">
          {warnings.map((warning) => (
            <li key={warning}>• {warning}</li>
          ))}
        </ul>
      ) : null}

      {state.people.map((person) => (
        <article
          key={person.stableKey}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-[10px] font-medium text-slate-500">Nome</span>
              <input
                value={person.name ?? ""}
                onChange={(event) =>
                  updatePerson(person.stableKey, {
                    name: event.target.value || null,
                  })
                }
                className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300"
              />
            </label>
            <label>
              <span className="text-[10px] font-medium text-slate-500">
                N. assicurato
              </span>
              <input
                value={person.insured_number ?? ""}
                onChange={(event) =>
                  updatePerson(person.stableKey, {
                    insured_number: event.target.value || null,
                  })
                }
                className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300"
              />
            </label>
            <NumberInput
              label="Franchigia (CHF)"
              value={person.franchise}
              onChange={(franchise) =>
                updatePerson(person.stableKey, { franchise })
              }
            />
            <label>
              <span className="text-[10px] font-medium text-slate-500">Modello</span>
              <input
                value={person.model ?? ""}
                onChange={(event) =>
                  updatePerson(person.stableKey, {
                    model: event.target.value || null,
                  })
                }
                className="mt-0.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-blue-300"
              />
            </label>
            <NumberInput
              label="Totale mensile persona (CHF)"
              value={person.total_monthly_premium}
              onChange={(total_monthly_premium) =>
                updatePerson(person.stableKey, { total_monthly_premium })
              }
              className="sm:col-span-2"
            />
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold text-slate-800">
              Coperture di {person.name ?? "questa persona"}
            </p>
            {person.coverages.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {person.coverages.map((coverage) => (
                  <CoverageEditor
                    key={coverage.stableKey}
                    coverage={coverage}
                    allPeople={state.people}
                    assignedToPersonKey={person.stableKey}
                    onChange={(next) =>
                      updatePersonCoverage(person.stableKey, coverage.stableKey, next)
                    }
                    onAssign={(targetKey) =>
                      reassignPersonCoverage(
                        person.stableKey,
                        coverage.stableKey,
                        targetKey
                      )
                    }
                    onRemove={() =>
                      removePersonCoverage(person.stableKey, coverage.stableKey)
                    }
                    removeLabel="unassign"
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-slate-500">
                Nessuna copertura assegnata.
              </p>
            )}
          </div>

          {person.coverages.length > 0 ? (
            <p className="mt-3 text-[11px] text-slate-500">
              Somma righe:{" "}
              {formatCHF(
                person.coverages.reduce(
                  (sum, coverage) => sum + (coverage.premium_final ?? 0),
                  0
                )
              )}
            </p>
          ) : null}
        </article>
      ))}

      <section className="rounded-2xl border border-amber-100 bg-amber-50/20 p-4">
        <h3 className="text-[12px] font-semibold text-amber-900">
          Coperture da verificare ({state.unassigned.length})
        </h3>
        <p className="mt-0.5 text-[11px] text-amber-800/80">
          Assegna ogni riga alla persona corretta, oppure rimuovila se non è valida.
        </p>
        {state.unassigned.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {state.unassigned.map((coverage) => (
              <CoverageEditor
                key={coverage.stableKey}
                coverage={coverage}
                allPeople={state.people}
                assignedToPersonKey={null}
                onChange={(next) => updateUnassigned(coverage.stableKey, next)}
                onAssign={(personKey) =>
                  assignUnassigned(coverage.stableKey, personKey)
                }
                onRemove={() => removeUnassigned(coverage.stableKey)}
                removeLabel="remove"
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-emerald-700">
            Tutte le coperture sono assegnate a una persona.
          </p>
        )}
      </section>
    </div>
  );
}
