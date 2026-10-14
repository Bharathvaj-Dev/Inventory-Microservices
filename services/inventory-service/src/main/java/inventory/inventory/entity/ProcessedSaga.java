package inventory.inventory.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "processed_sagas",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "saga_id")
    }
)
public class ProcessedSaga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "saga_id", nullable = false, unique = true)
    private String sagaId;

    public ProcessedSaga() {
    }

    public ProcessedSaga(String sagaId) {
        this.sagaId = sagaId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSagaId() {
        return sagaId;
    }

    public void setSagaId(String sagaId) {
        this.sagaId = sagaId;
    }
}
