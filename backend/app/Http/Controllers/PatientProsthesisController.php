<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProsthesisResource;
use App\Models\Component;
use App\Models\Prosthesis;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * A patient's prostheses as the caller may see them. The routes authorize every
 * request; which prostheses are visible is decided by Prosthesis::visibleTo().
 */
class PatientProsthesisController extends Controller
{
    public function index(Request $request, User $patient): AnonymousResourceCollection
    {
        $prostheses = Prosthesis::query()
            ->visibleTo($this->actor($request), $patient)
            ->with(['components' => $this->inInstallationOrder(...)])
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        return ProsthesisResource::collection($prostheses);
    }

    /**
     * The patient is bound so the prosthesis is resolved among their prostheses only.
     */
    public function show(User $patient, Prosthesis $prosthesis): ProsthesisResource
    {
        return ProsthesisResource::make(
            $prosthesis->load(['components' => $this->inInstallationOrder(...)]),
        );
    }

    /**
     * @param  HasMany<Component, Prosthesis>  $components
     */
    private function inInstallationOrder(HasMany $components): void
    {
        $components->orderBy('installed_at')->orderBy('id');
    }

    private function actor(Request $request): User
    {
        $user = $request->user();

        abort_unless($user instanceof User, Response::HTTP_UNAUTHORIZED);

        return $user;
    }
}
