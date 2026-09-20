/**
 * @typedef {Object} AnimalOption
 * @property {number} id
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string} owner_name
 */

/**
 * @typedef {Object} VeterinarianOption
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * @typedef {Object} VisitFormValues
 * @property {number} animal
 * @property {number} veterinarian
 * @property {string} visit_date
 * @property {string} reason
 * @property {string} notes
 * @property {'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} status
 */

/**
 * @typedef {Object} VisitFormProps
 * @property {AnimalOption[]} animals
 * @property {VeterinarianOption[]} veterinarians
 * @property {VisitFormValues | null} initialValues
 * @property {'idle' | 'saving' | 'error'} status
 * @property {(values: VisitFormValues) => Promise<void>} onSubmit
 * @property {() => void} onCancel
 */

/** @type {Record<'dog' | 'cat' | 'other', string>} */
const speciesLabels = {
  dog: 'pies',
  cat: 'kot',
  other: 'inne',
}

/**
 * Converts an API date-time value to the format required
 * by an HTML datetime-local input.
 *
 * @param {string} value
 * @returns {string}
 */
function formatDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16)
}

/**
 * @param {VisitFormProps} props
 */
function VisitForm(props) {
  const {
    animals,
    veterinarians,
    initialValues,
    status,
    onSubmit,
    onCancel,
  } = props 
  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    await onSubmit({
      animal: Number(formData.get('animal')),
      veterinarian: Number(formData.get('veterinarian')),
      visit_date: String(formData.get('visit_date') ?? ''),
      reason: String(formData.get('reason') ?? '').trim(),
      notes: String(formData.get('notes') ?? '').trim(),
      status: /** @type {'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} */ (
        String(formData.get('status') ?? 'SCHEDULED')
      ),
    })
  }

  return (
    <div className="animal-form-card">
      <div className="animal-form-heading">
        <div>
          <h2>
            {initialValues ? 'Edytuj wizytę' : 'Dodaj wizytę'}
          </h2>
          <p>
            {initialValues
              ? 'Zmień dane wybranej wizyty.'
              : 'Wprowadź dane nowej wizyty.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
        >
          Anuluj
        </button>
      </div>

      <form
        className="animal-form"
        onSubmit={handleSubmit}
      >
        <label>
          Pacjent
          <select
            name="animal"
            defaultValue={initialValues?.animal ?? ''}
            required
          >
            <option value="" disabled>
              Wybierz pacjenta
            </option>

            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.name} — {speciesLabels[animal.species]} — {animal.owner_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Weterynarz
          <select
            name="veterinarian"
            defaultValue={initialValues?.veterinarian ?? ''}
            required
          >
            <option value="" disabled>
              Wybierz weterynarza
            </option>

            {veterinarians.map((veterinarian) => (
              <option
                key={veterinarian.id}
                value={veterinarian.id}
              >
                {veterinarian.first_name} {veterinarian.last_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Data i godzina
          <input
            type="datetime-local"
            name="visit_date"
            defaultValue={
              initialValues
                ? formatDateTimeLocal(initialValues.visit_date)
                : ''
            }
            required
          />
        </label>

        <label>
          Status
          <select
            name="status"
            defaultValue={initialValues?.status ?? 'SCHEDULED'}
            required
          >
            <option value="SCHEDULED">Zaplanowana</option>
            <option value="COMPLETED">Zakończona</option>
            <option value="CANCELLED">Anulowana</option>
          </select>
        </label>

        <label className="animal-form-full-width">
          Powód wizyty
          <input
            type="text"
            name="reason"
            defaultValue={initialValues?.reason ?? ''}
            maxLength={255}
            required
          />
        </label>

        <label className="animal-form-full-width">
          Notatki
          <textarea
            name="notes"
            rows={3}
            defaultValue={initialValues?.notes ?? ''}
          />
        </label>

        {status === 'error' && (
          <p className="form-error">
            Nie udało się zapisać wizyty.
            Sprawdź dane i spróbuj ponownie.
          </p>
        )}

        <div className="animal-form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={status === 'saving'}
          >
            {status === 'saving'
              ? 'Zapisywanie...'
              : initialValues
                ? 'Zapisz zmiany'
                : 'Zapisz wizytę'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VisitForm
