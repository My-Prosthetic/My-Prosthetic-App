<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserShare;
use App\ValueObjects\SharePermissions;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<UserShare> */
class UserShareFactory extends Factory
{
    protected $model = UserShare::class;

    public function definition(): array
    {
        return [
            'patient_id' => User::factory(),
            'specialist_id' => User::factory()->prosthetist(),
            'permissions' => SharePermissions::none(),
        ];
    }
}
