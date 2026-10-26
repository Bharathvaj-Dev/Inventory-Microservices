
package inventory.gateway;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiCatalogController {

    @GetMapping("/docs")
    public ResponseEntity<Void> apiCatalog() {
        return ResponseEntity
                .status(302)
                .location(URI.create("/docs.html"))
                .build();
    }
}
