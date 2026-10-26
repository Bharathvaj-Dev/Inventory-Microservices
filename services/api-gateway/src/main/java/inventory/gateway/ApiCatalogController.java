package inventory.gateway;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "API Documentation", description = "API documentation landing page")
public class ApiCatalogController {

    @GetMapping("/docs")
    @Operation(
        summary = "Open API documentation",
        description = "Redirects to the API documentation landing page"
    )
    @ApiResponse(
        responseCode = "302",
        description = "Redirects to the documentation landing page"
    )
    public ResponseEntity<Void> apiCatalog() {
        return ResponseEntity
                .status(302)
                .location(URI.create("/docs.html"))
                .build();
    }
}