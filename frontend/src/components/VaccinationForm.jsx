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
 * @typedef {Object} VaccinationFormValues
 * @property {number} animal
 * @property {number} veterinarian
 * @property {string} vaccine_name
 * @property {string} manufacturer
 * @property {string} batch_number
 * @property {string} vaccination_date
 * @property {string | null} next_due_date
 * @property {string} notes
 */

/**
 * @typedef {Object} VaccinationFormProps
 * @property {AnimalOption[]} animals
 * @property {VeterinarianOption[]} veterinarians
 * @property {VaccinationFormValues | null} initialValues
 * @property {'idle' | 'saving' | 'error'} status
 * @property {(values: VaccinationFormValues) => Promise<void>} onSubmit
 * @property {() => void} onCancel
 */

/** @type {Record<'dog' | 'cat' | 'other', string>} */
const speciesLabels = {
  dog: 'pies',
  cat: 'kot',
  other: 'inne',
}

/**
 * @param {VaccinationFormProps} props
 */
function VaccinationForm(props) {
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
    const nextDueDate = String(formData.get('next_due_date') ?? '')

    await onSubmit({
      animal: Number(formData.get('animal')),
      veterinarian: Number(formData.get('veterinarian')),
      vaccine_name: String(formData.get('vaccine_name') ?? '').trim(),
      manufacturer: String(formData.get('manufacturer') ?? '').trim(),
      batch_number: String(formData.get('batch_number') ?? '').trim(),
      vaccination_date: String(
        formData.get('vaccination_date') ?? '',
      ),
      next_due_date: nextDueDate || null,
      notes: String(formData.get('notes') ?? '').trim(),
    })
  }

  return (
    <div className="animal-form-card">
      <div className="animal-form-heading">
        <div>
          <h2>
            {initialValues ? 'Edytuj szczepienie' : 'Dodaj szczepienie'}
          </h2>
          <p>
            {initialValues
              ? 'Zmień dane wybranego szczepienia.'
              : 'Wprowadź dane nowego szczepienia.'}
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

        <label className="animal-form-full-width">
          Nazwa szczepionki
          <input
            type="text"
            name="vaccine_name"
            defaultValue={initialValues?.vaccine_name ?? ''}
            maxLength={150}
            required
          />
        </label>

        <label>
          Producent
          <input
            type="text"
            name="manufacturer"
            defaultValue={initialValues?.manufacturer ?? ''}
            maxLength={150}
          />
        </label>

        <label>
          Numer serii
          <input
            type="text"
            name="batch_number"
            defaultValue={initialValues?.batch_number ?? ''}
            maxLength={100}
          />
        </label>

        <label>
          Data szczepienia
          <input
            type="date"
            name="vaccination_date"
            defaultValue={initialValues?.vaccination_date ?? ''}
            required
          />
        </label>

        <label>
          Termin kolejnej dawki
          <input
            type="date"
            name="next_due_date"
            defaultValue={initialValues?.next_due_date ?? ''}
          />
        </label>

        <label className="animal-form-full-width">
          Uwagi
          <textarea
            name="notes"
            rows={3}
            defaultValue={initialValues?.notes ?? ''}
          />
        </label>

        {status === 'error' && (
          <p className="form-error">
            Nie udało się zapisać szczepienia.
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
                : 'Zapisz szczepienie'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VaccinationForm