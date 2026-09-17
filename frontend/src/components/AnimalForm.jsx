/**
 * @typedef {Object} OwnerOption
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * @typedef {Object} AnimalFormValues
 * @property {number} owner
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string} breed
 * @property {string | null} birth_date
 * @property {string} chip_number
 * @property {string} notes
 */

/**
 * @typedef {Object} AnimalFormInitialValues
 * @property {number} owner
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string | null} breed
 * @property {string | null} birth_date
 * @property {string | null} chip_number
 * @property {string | null} notes
 */

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {OwnerOption[]} props.owners
 * @param {AnimalFormInitialValues} [props.initialValues]
 * @param {'idle' | 'saving' | 'error'} props.status
 * @param {(values: AnimalFormValues) => Promise<void>} props.onSubmit
 * @param {() => void} props.onCancel
 */


function AnimalForm({
  title,
  description,
  owners,
  initialValues,
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
    const birthDate = String(
      formData.get('birth_date') ?? '',
    ).trim()

    await onSubmit({
      owner: Number(formData.get('owner')),
      name: String(formData.get('name') ?? '').trim(),
      species: /** @type {'dog' | 'cat' | 'other'} */ (
        String(formData.get('species') ?? '')
      ),
      breed: String(formData.get('breed') ?? '').trim(),
      birth_date: birthDate || null,
      chip_number: String(
        formData.get('chip_number') ?? '',
      ).trim(),
      notes: String(formData.get('notes') ?? '').trim(),
    })
  }

  return (
    <div className="animal-form-card">
      <div className="animal-form-heading">
        <div>
            <h2>{title}</h2>
            <p>{description}</p>
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
          Właściciel
          <select
            name="owner"
            defaultValue={initialValues?.owner ?? ''}
            required
          >
            <option value="" disabled>
              Wybierz właściciela
            </option>

            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.first_name} {owner.last_name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Imię
          <input
            type="text"
            name="name"
            defaultValue={initialValues?.name ?? ''}
            required
          />
        </label>

        <label>
          Gatunek
          <select
            name="species"
            defaultValue={initialValues?.species ?? ''}
            required
          >
            <option value="" disabled>
              Wybierz gatunek
            </option>
            <option value="dog">Pies</option>
            <option value="cat">Kot</option>
            <option value="other">Inny</option>
          </select>
        </label>

        <label>
          Rasa
          <input
            type="text"
            name="breed"
            defaultValue={initialValues?.breed ?? ''}
          />
        </label>

        <label>
          Data urodzenia
          <input
            type="date"
            name="birth_date"
            defaultValue={initialValues?.birth_date ?? ''}
          />
        </label>

        <label>
          Numer chipa
          <input
            type="text"
            name="chip_number"
            defaultValue={initialValues?.chip_number ?? ''}
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
            Nie udało się zapisać zwierzęcia.
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
              : 'Zapisz zwierzę'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AnimalForm