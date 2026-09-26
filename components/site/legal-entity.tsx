/**
 * The legal operator of this deployment, for the privacy policy and terms.
 *
 * Never invented: it comes only from server-side env vars. Until the owner
 * sets them, the legal pages show clearly marked placeholders instead of a
 * made-up company.
 *
 *   LEGAL_ENTITY_NAME      registered company name
 *   LEGAL_ENTITY_ADDRESS   registered address
 *   LEGAL_REGISTRY_CODE    commercial registry code
 */
export interface LegalEntity {
  name: string | null
  address: string | null
  registryCode: string | null
}

function envValue(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

export function getLegalEntity(): LegalEntity {
  return {
    name: envValue("LEGAL_ENTITY_NAME"),
    address: envValue("LEGAL_ENTITY_ADDRESS"),
    registryCode: envValue("LEGAL_REGISTRY_CODE"),
  }
}

function Field({ label, value, placeholder }: { label: string; value: string | null; placeholder: string }) {
  return (
    <p>
      <strong>{label}:</strong>{" "}
      {value ?? (
        <span className="italic" data-placeholder="true">
          {placeholder}
        </span>
      )}
    </p>
  )
}

/** "Who we are" block. Renders placeholders when the env vars are unset. */
export function LegalEntityDetails({ entity = getLegalEntity() }: { entity?: LegalEntity }) {
  return (
    <div className="space-y-1">
      <Field label="Operator" value={entity.name} placeholder="[company name to be added]" />
      <Field label="Registered address" value={entity.address} placeholder="[registered address to be added]" />
      <Field label="Registry code" value={entity.registryCode} placeholder="[registry code to be added]" />
    </div>
  )
}
