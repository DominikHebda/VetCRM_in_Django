/**
 * @typedef {Object} VisitOption
 * @property {number} id
 * @property {string} animal_name
 * @property {string} animal_owner_name
 * @property {string} visit_date
 */

/**
 * @typedef {Object} MedicalRecordFormValues
 * @property {number} visit
 * @property {string} diagnosis
 * @property {string} treatment
 * @property {string} recommendations
 * @property {string | null} weight
 * @property {string | null} temperature
 */

/**
 * @param {Object} props
 * @param {VisitOption[]} props.visits
 * @param {'idle' | 'saving' | 'error'} props.status
 * @param {(values: MedicalRecordFormValues) => Promise<void>} props.onSubmit
 * @param {() => void} props.onCancel
 */
function MedicalRecordForm({
  visits,
  status,
  onSubmit,
  onCancel,
}) {
  /**
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  async function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const weight = String(formData.get('weight') ?? '').trim()
    const temperature = String(
      formData.get('temperature') ?? '',
    ).trim()

    await onSubmit({
      visit: Number(formData.get('visit')),
      diagnosis: String(
        formData.get('diagnosis') ?? '',
      ).trim(),
      treatment: String(
        formData.get('treatment') ?? '',
      ).trim(),
      recommendations: String(
        formData.get('recommendations') ?? '',
      ).trim(),
      weight: weight || null,
      temperature: temperature || null,
    })
  }

  return (
    <div className="animal-form-card">
      <div className="animal-form-heading">
        <div>
          <h2>Nowa dokumentacja medyczna</h2>
          <p>
            Uzupełnij rozpoznanie i informacje dotyczące leczenia
            pacjenta.
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
        <label className="animal-form-full-width">
          Wizyta
          <select
            name="visit"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Wybierz wizytę
            </option>

            {visits.map((visit) => (
              <option key={visit.id} value={visit.id}>
                {visit.animal_name} — {visit.animal_owner_name}
              </option>
            ))}
          </select>
        </label>

        <label className="animal-form-full-width">
          Diagnoza
          <textarea
            name="diagnosis"
            rows={3}
            required
          />
        </label>

        <label className="animal-form-full-width">
          Leczenie
          <textarea
            name="treatment"
            rows={3}
          />
        </label>

        <label className="animal-form-full-width">
          Zalecenia
          <textarea
            name="recommendations"
            rows={3}
          />
        </label>

        <label>
          Waga (kg)
          <input
            type="number"
            name="weight"
            min="0"
            step="0.01"
          />
        </label>

        <label>
          Temperatura (°C)
          <input
            type="number"
            name="temperature"
            step="0.1"
          />
        </label>

        {status === 'error' && (
          <p className="form-error">
            Nie udało się zapisać dokumentacji medycznej.
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
              : 'Zapisz dokumentację'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MedicalRecordForm