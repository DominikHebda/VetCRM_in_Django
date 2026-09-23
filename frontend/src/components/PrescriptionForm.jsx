import { useState } from 'react'

/**
 * @typedef {Object} AnimalOption
 * @property {number} id
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string} owner_name
 */

/**
 * @typedef {Object} VisitOption
 * @property {number} id
 * @property {number} animal
 * @property {string} visit_date
 * @property {string} reason
 * @property {'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} status
 */

/**
 * @typedef {Object} PrescriptionFormValues
 * @property {number} animal
 * @property {number} visit
 * @property {string} medication_name
 * @property {string} active_substance
 * @property {string} dosage
 * @property {string} frequency
 * @property {string} duration
 * @property {number} quantity
 * @property {string} issue_date
 * @property {string} valid_until
 * @property {string} instructions
 */

/**
 * @typedef {Object} PrescriptionFormProps
 * @property {AnimalOption[]} animals
 * @property {VisitOption[]} visits
 * @property {PrescriptionFormValues | null} initialValues
 * @property {'idle' | 'saving' | 'error'} status
 * @property {(values: PrescriptionFormValues) => Promise<void>} onSubmit
 * @property {() => void} onCancel
 */

/** @type {Record<'dog' | 'cat' | 'other', string>} */
const speciesLabels = {
  dog: 'pies',
  cat: 'kot',
  other: 'inne',
}

/**
 * @param {string} value
 * @returns {string}
 */
function formatVisitDate(value) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

/**
 * @param {PrescriptionFormProps} props
 */
function PrescriptionForm(props) {
  const {
    animals,
    visits,
    initialValues,
    status,
    onSubmit,
    onCancel,
  } = props

  const [selectedAnimal, setSelectedAnimal] = useState(
    initialValues?.animal ?? null,
  )

  const availableVisits = selectedAnimal
    ? visits.filter((visit) => visit.animal === selectedAnimal)
    : []

  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    await onSubmit({
      animal: Number(formData.get('animal')),
      visit: Number(formData.get('visit')),
      medication_name: String(
        formData.get('medication_name') ?? '',
      ).trim(),
      active_substance: String(
        formData.get('active_substance') ?? '',
      ).trim(),
      dosage: String(formData.get('dosage') ?? '').trim(),
      frequency: String(formData.get('frequency') ?? '').trim(),
      duration: String(formData.get('duration') ?? '').trim(),
      quantity: Number(formData.get('quantity')),
      issue_date: String(formData.get('issue_date') ?? ''),
      valid_until: String(formData.get('valid_until') ?? ''),
      instructions: String(
        formData.get('instructions') ?? '',
      ).trim(),
    })
  }

  return (
    <div className="animal-form-card">
      <div className="animal-form-heading">
        <div>
          <h2>
            {initialValues ? 'Edytuj receptę' : 'Dodaj receptę'}
          </h2>
          <p>
            {initialValues
              ? 'Zmień dane wybranej recepty.'
              : 'Wprowadź dane nowej recepty.'}
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
            value={selectedAnimal ?? ''}
            required
            onChange={(event) => {
              const value = event.target.value

              setSelectedAnimal(value ? Number(value) : null)
            }}
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
          Wizyta
          <select
            name="visit"
            defaultValue={initialValues?.visit ?? ''}
            required
            disabled={!selectedAnimal}
          >
            <option value="" disabled>
              {selectedAnimal
                ? 'Wybierz wizytę'
                : 'Najpierw wybierz pacjenta'}
            </option>

            {availableVisits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {formatVisitDate(visit.visit_date)} — {visit.reason}
              </option>
            ))}
          </select>
        </label>

        <label className="animal-form-full-width">
          Nazwa leku
          <input
            type="text"
            name="medication_name"
            defaultValue={initialValues?.medication_name ?? ''}
            maxLength={200}
            required
          />
        </label>

        <label className="animal-form-full-width">
          Substancja czynna
          <input
            type="text"
            name="active_substance"
            defaultValue={initialValues?.active_substance ?? ''}
            maxLength={200}
          />
        </label>

        <label>
          Dawkowanie
          <input
            type="text"
            name="dosage"
            defaultValue={initialValues?.dosage ?? ''}
            maxLength={100}
            required
          />
        </label>

        <label>
          Częstotliwość
          <input
            type="text"
            name="frequency"
            defaultValue={initialValues?.frequency ?? ''}
            maxLength={100}
            required
          />
        </label>

        <label>
          Czas stosowania
          <input
            type="text"
            name="duration"
            defaultValue={initialValues?.duration ?? ''}
            maxLength={100}
            required
          />
        </label>

        <label>
          Ilość
          <input
            type="number"
            name="quantity"
            defaultValue={initialValues?.quantity ?? ''}
            min={1}
            required
          />
        </label>

        <label>
          Data wystawienia
          <input
            type="date"
            name="issue_date"
            defaultValue={initialValues?.issue_date ?? ''}
            required
          />
        </label>

        <label>
          Ważna do
          <input
            type="date"
            name="valid_until"
            defaultValue={initialValues?.valid_until ?? ''}
            required
          />
        </label>

        <label className="animal-form-full-width">
          Zalecenia
          <textarea
            name="instructions"
            rows={3}
            defaultValue={initialValues?.instructions ?? ''}
          />
        </label>

        {status === 'error' && (
          <p className="form-error">
            Nie udało się zapisać recepty.
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
                : 'Zapisz receptę'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PrescriptionForm